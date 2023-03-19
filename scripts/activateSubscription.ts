import { toNano } from 'ton-core';
import {Subscription, SubscriptionConfig} from '../wrappers/Subscription';
import { compile, NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const config: SubscriptionConfig = {
        serviceProviderAddress: provider.sender().address!,
        pricePerDay: toNano('0.01'),
        paidUntil: 0,
    }
    const subscription = provider.open(Subscription.createFromConfig(config, await compile('Subscription')));

    const before = await subscription.getPaidUntil();

    await subscription.sendActivate(provider.sender(), toNano('0.01'));

    ui.write('Waiting for paid_until to change...');

    let attempt = 1;
    while(before === await subscription.getPaidUntil()) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        await sleep(1000);
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Activated!');
}
