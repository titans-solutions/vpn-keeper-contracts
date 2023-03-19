import {Blockchain, SandboxContract, SmartContract, TreasuryContract} from '@ton-community/sandbox';
import {Cell, toNano} from 'ton-core';
import {Subscription} from '../wrappers/Subscription';
import '@ton-community/test-utils';
import {compile} from '@ton-community/blueprint';

describe('Subscription', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Subscription');
    });

    let blockchain: Blockchain;
    let serviceProvider: SandboxContract<TreasuryContract>;
    let client: SandboxContract<TreasuryContract>;
    let subscription: SandboxContract<Subscription>;
    let contract: SmartContract;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        serviceProvider = await blockchain.treasury('service_provider');
        client = await blockchain.treasury('client');

        subscription = blockchain.openContract(
            Subscription.createFromConfig({
                    serviceProviderAddress: serviceProvider.address,
                    clientAddress: client.address,
                    pricePerDay: toNano('0.01'),
                    paidUntil: 0,
                },
                code)
        );

        contract = await blockchain.getContract(subscription.address);

        const deployResult = await subscription.sendDeploy(serviceProvider.getSender(), toNano('0.1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: serviceProvider.address,
            to: subscription.address,
            deploy: true,
        });
    });

    it('should deploy', async () => {

        expect(await subscription.getPricePerDay()).toEqual(toNano('0.01'));
        expect(await subscription.getPaidUntil()).toEqual(0);
        expect((await subscription.getClientAddress()).toRawString()).toEqual(client.address.toRawString());
    });


    it('should pay for 3 days', async () => {
        const clientSender = client.getSender();

        const payResult = await subscription.sendActivate(clientSender, toNano('0.03'));

        expect(payResult.transactions).toHaveTransaction({
            from: client.address,
            to: subscription.address,
            success: true,
        });

        expect(payResult.transactions).toHaveTransaction({
            from: subscription.address,
            to: serviceProvider.address,
            success: true,
        });

        const now = Math.floor(Date.now() / 1000);
        const expectedPaidUntil = now + 3 * 24 * 60 * 60;
        expect(await subscription.getPaidUntil()).toEqual(expectedPaidUntil);

        // check that subsequent activation extends the paid_until
        const expectedPaidUntil2 = expectedPaidUntil + 2 * 24 * 60 * 60;
        await subscription.sendActivate(clientSender, toNano('0.02'));
        expect(await subscription.getPaidUntil()).toEqual(expectedPaidUntil2);
    });
});
