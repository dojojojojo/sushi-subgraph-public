import {
    CosmosBlock,
    CosmosEvent,
    MsgExecuteContract,
} from "@subql/types-cosmos";
import { AirdropClaim, Burn, Harvest, Mint, NFTAction, Swap, Transfer } from "../types";

(BigInt.prototype as any).toJSON = function () { return this.toString() }


export let ZERO_BI = BigInt(0);
export let ONE_BI = BigInt(1);

function toDayStartTimestampInSeconds(epochTimestampInSeconds: number) {
    var date = new Date(epochTimestampInSeconds * 1000); // Convert to milliseconds
    date.setHours(0, 0, 0, 0); // Set to start of the day
    return Math.floor(date.getTime() / 1000); // Convert back to seconds
}

export async function handleNFT(event: CosmosEvent): Promise<void> {
    let timestampString = event.block.block.header.time as unknown as string;
    let timestamp = parseInt(
        (new Date(timestampString).getTime() / 1000).toFixed(0)
    );
    if (!timestamp) {
        return;
    }
    // let dayID = timestamp / 86400;
    let dayStartTimestamp = toDayStartTimestampInSeconds(timestamp);

    const id = event.tx.hash;
    const log = event.log;
    const logEvents = log.events;

    const wasmEvents = logEvents.filter((e) => e.type === "wasm"); // should always exist
    if (wasmEvents.length == 0) {
        return;
    }

    const allData: any[] = [];
    for (let i = 0; i < wasmEvents.length; i++) {
        const wasmEvent = wasmEvents[i];
        const eventAttributes = wasmEvent.attributes;
        const transformedObj: any = {};

        for (const attr of eventAttributes) {
            transformedObj[attr.key] = attr.value;
        }

        const action = transformedObj.action;

        const data = {
            ...transformedObj,
            id: id.concat("-").concat(action),
            txHash: event.tx.hash,
            date: timestamp,
            day: dayStartTimestamp,
            action: action,
            timestamp: BigInt(timestamp || 0),
            block: BigInt(event.block.block.header.height),
        };
        allData.push(data);
    }

    // Get all the swaps events from the data
    const lpAddress = "inj12eca9xszt84qm9tztyuje96nn3v2wd3v4yrzge"
    const swapEvents = allData.filter((e) => e.action === "swap");
    swapEvents.forEach((swapEvent, index) => {
        if (swapEvent && swapEvent._contract_address === lpAddress) {
            swapEvent.swapIndex = index;

            // find mint such that to address is same as swap to address
            const mintEvents = allData.filter((e) => e.action === "mint" && e.owner === swapEvent.receiver);
            mintEvents.forEach((e) => {
                e.swapFromKnownID = true;
                e.amount = swapEvent.return_amount;
            })
        }
    })

    const airdropContract = 'inj1mu202y7un7ye2ayu3fx6smj9l5eddfxaa4qu4f';
    const claimEvents = allData.filter((e) => e.action === "claim");
    claimEvents.forEach((claimEvent, index) => {
        if (claimEvent && claimEvent._contract_address === airdropContract) {
            claimEvent.swapIndex = index;

            // find mint such that to address is same as swap to address
            const mintEvents = allData.filter((e) => e.action === "mint" && e.owner === claimEvent.address);
            mintEvents.forEach((e) => {
                e.claimFromKnownID = true;
                e.amount = claimEvent.amount;
            })
        }
    });

    const launchpadContract = 'inj1u2zs6hwmygc3aeqerstz4h82hatj3852h7dh4a';
    const harvestEvents = allData.filter((e) => {
        if(e.action && typeof e.action === "string"){
            return e.action.includes("harvest")
        }
    });
    harvestEvents.forEach((harvestEvent, index) => {
        if (harvestEvent && harvestEvent._contract_address === launchpadContract) {
            harvestEvent.swapIndex = index;

            // find mint such that to address is same as swap to address
            const mintEvents = allData.filter((e) => e.action === "mint" && e.owner === harvestEvent.address);
            mintEvents.forEach((e) => {
                e.harvestFromKnownID = true;
                e.amount = harvestEvent.refund_amount;
            })
        }
    });

    for (let i = 0; i < allData.length; i++) {
        const data = allData[i];
        try {
            if (data.action === "mint") {
                data.action = NFTAction.Mint;
                data.id = id.concat("-").concat(data.token_id);
                await handleMint(data.id, timestamp, dayStartTimestamp, { ...data });
            }
            if (data.action === "burn") {
                data.action = NFTAction.Burn;
                data.id = id.concat("-").concat(data.token_id);
                await handleBurn(data.id, timestamp, dayStartTimestamp, data);
            }
            if (data.action === "transfer") {
                data.action = NFTAction.Transfer;
                data.id = id.concat("-").concat(data.from).concat("-").concat(data.to);
                await handleTransfer(data.id, timestamp, dayStartTimestamp, data);
            }
            if (data.action === "swap") {
                data.action = NFTAction.Swap;
                data.id = id.concat("-").concat(data.swapIndex);
                await handleSwap(data.id, timestamp, dayStartTimestamp, { ...data });
            }
            if (data.action === "harvest") {
                data.action = "harvest";
                data.id = id.concat("-").concat(data.address)
                await handleHarvestEvent(data.id, timestamp, dayStartTimestamp, { ...data });
            }
            if (data.action === "claim") {
                data.action = "claim";
                data.id = id.concat("-").concat(data.address)
                await handleAirdropEvent(data.id, timestamp, dayStartTimestamp, { ...data });
            }
        } catch (err) {
            logger.error(err)
        }
    }

}


export async function handleMint(id: any, date: any, day: any, transformedObj: any) {
    let amount = Number(transformedObj.amount || 0) / Number(10 ** 18);
    const correctMint = (transformedObj.swapFromKnownID && amount >=0.5) || transformedObj.harvestFromKnownID || transformedObj.claimFromKnownID;

    const data = {
        id: id,
        txHash: transformedObj.txHash,
        date: day,
        // day: day,
        action: transformedObj.action,
        shouldMint: correctMint || false,
        minter: transformedObj.minter,
        owner: transformedObj.owner,
        tokenId: BigInt(transformedObj.token_id),
        timestamp: transformedObj.timestamp,
        block: transformedObj.block,
    };
    const mint = Mint.create(data);
    await mint.save()
    logger.info(`saving new mint, ${JSON.stringify(mint)} ${amount}`);
}

export async function handleBurn(id: any, date: any, day: any, transformedObj: any) {
    const data = {
        id: id,
        txHash: transformedObj.txHash,
        date: day,
        action: transformedObj.action,
        sender: transformedObj.sender,
        tokenId: BigInt(transformedObj.token_id),
        timestamp: transformedObj.timestamp,
        block: transformedObj.block,
    };
    const burn = Burn.create(data);
    await burn.save()
    logger.info(`saving burn, ${JSON.stringify(burn)}`);
}

export async function handleTransfer(id: any, date: any, day: any, transformedObj: any) {
    const data = {
        id: id,
        txHash: transformedObj.txHash,
        date: day,
        // day: day,
        action: transformedObj.action,
        from: transformedObj.from,
        to: transformedObj.to,
        amount: BigInt(transformedObj.amount),
        timestamp: transformedObj.timestamp,
        block: transformedObj.block,
    };
    const transfer = Transfer.create(data);
    await transfer.save()
    logger.info(`saving transfer, ${JSON.stringify(transfer)}`);
}

export async function handleSwap(id: any, date: any, day: any, transformedObj: any) {
    const data = {
        id: id,
        txHash: transformedObj.txHash,
        date: day,
        // day: day,
        action: transformedObj.action,
        sender: transformedObj.sender,
        receiver: transformedObj.receiver,
        offerAsset: transformedObj.offer_asset,
        askAsset: transformedObj.ask_asset,
        offerAmount: BigInt(transformedObj.offer_amount),
        returnAmount: BigInt(transformedObj.return_amount),
        spreadAmount: BigInt(transformedObj.spread_amount),
        commissionAmount: BigInt(transformedObj.commission_amount),
        timestamp: transformedObj.timestamp,
        block: transformedObj.block,
    };
    const swap = Swap.create(data);
    await swap.save()
    logger.info(`saving swap, ${JSON.stringify(swap)}`);
}


export async function handleHarvestEvent(id: any, date: any, day: any, transformedObj: any) {
    const data = {
        id: id,
        txHash: transformedObj.txHash,
        date: day,
        // day: day,
        action: transformedObj.action,
        address: transformedObj.address,
        offeringAmount: BigInt(transformedObj.offering_amount),
        refundAmount: BigInt(transformedObj.refund_amount),
        shouldMint: true,
        timestamp: transformedObj.timestamp,
        block: transformedObj.block,
    };
    const harvest = Harvest.create(data);
    await harvest.save()
    logger.info(`saving harvest, ${JSON.stringify(harvest)}`);
}

export async function handleAirdropEvent(id: any, date: any, day: any, transformedObj: any) {
    const data = {
        id: id,
        txHash: transformedObj.txHash,
        date: day,
        // day: day,
        action: transformedObj.action,
        stage: transformedObj.stage,
        address: transformedObj.address,
        amount: BigInt(transformedObj.amount),
        shouldMint: true,
        timestamp: transformedObj.timestamp,
        block: transformedObj.block,
    };
    const airdrop = AirdropClaim.create(data);
    await airdrop.save()
    logger.info(`saving airdrop, ${JSON.stringify(airdrop)}`);
}