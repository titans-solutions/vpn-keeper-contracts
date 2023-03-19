import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type SubscriptionConfig = {
    serviceProviderAddress: Address;
    clientAddress: Address;
    pricePerDay: bigint;
    paidUntil: number;
};

export function subscriptionConfigToCell(config: SubscriptionConfig): Cell {
    return beginCell()
        .storeAddress(config.serviceProviderAddress)
        .storeAddress(config.clientAddress)
        .storeUint(config.pricePerDay, 64)
        .storeUint(config.paidUntil, 32)
        .endCell();
}

const opcodes = {
    activate: 0xC8BBE49C,
}

export class Subscription implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Subscription(address);
    }

    static createFromConfig(config: SubscriptionConfig, code: Cell, workchain = 0) {
        const data = subscriptionConfigToCell(config);
        const init = { code, data };
        return new Subscription(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });
    }


    async sendActivate(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(opcodes.activate, 32)
                .endCell(),
        });
    }

    async getPricePerDay(provider: ContractProvider) {
        const result = await provider.get('get_price_per_day', []);
        return result.stack.readBigNumber();
    }

    async getPaidUntil(provider: ContractProvider) {
        const result = await provider.get('get_paid_until', []);
        return result.stack.readNumber();
    }

    async getClientAddress(provider: ContractProvider) {
        const result = await provider.get('get_client_address', []);
        return result.stack.readAddress();
    }
}
