import { toNano } from 'ton-core';
import {Subscription, SubscriptionConfig} from '../wrappers/Subscription';
import { compile, NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const config: SubscriptionConfig = {
        masterAddress: provider.sender().address!,
        pricePerDay: toNano('0.01'),
        paidUntil: 0,
    }
    const subscription = provider.open(Subscription.createFromConfig(config, await compile('Subscription')));

    const paidUntil = await subscription.getPaidUntil();

    ui.write('Paid until: ' + new Date(paidUntil * 1000));
}
