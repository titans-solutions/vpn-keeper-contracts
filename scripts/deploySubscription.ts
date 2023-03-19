import { toNano } from 'ton-core';
import {Subscription, SubscriptionConfig} from '../wrappers/Subscription';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const config: SubscriptionConfig = {
        serviceProviderAddress: provider.sender().address!,
        pricePerDay: toNano('0.01'),
        paidUntil: 0,
    }
    const subscription = provider.open(Subscription.createFromConfig(config, await compile('Subscription')));

    await subscription.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(subscription.address);

    // run methods on `subscription`
}
