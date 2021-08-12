import React from 'react';
import { addGlobalFill } from 'foremanReact/components/common/Fill/GlobalFill';
import { registerReducer } from 'foremanReact/common/MountingService';

import SystemStatuses from './components/extensions/about';
import RegistrationCommands from './components/extensions/RegistrationCommands';
import ContentTab from './components/extensions/HostDetails/Tabs/ContentTab';
import SubscriptionTab from './components/extensions/HostDetails/Tabs/SubscriptionTab';
import TraceTab from './components/extensions/HostDetails/Tabs/TraceTab';
import extendReducer from './components/extensions/reducers';
import rootReducer from './redux/reducers';

registerReducer('katelloExtends', extendReducer);
registerReducer('katello', rootReducer);


addGlobalFill('aboutFooterSlot', '[katello]AboutSystemStatuses', <SystemStatuses key="katello-system-statuses" />, 100);
addGlobalFill('registrationAdvanced', '[katello]RegistrationCommands', <RegistrationCommands key="katello-reg" />, 100);
addGlobalFill('host-details-page-tabs', 'Content', <ContentTab key="content" />, 100);
addGlobalFill('host-details-page-tabs', 'Subscription', <SubscriptionTab key="subscription" />, 100);
addGlobalFill('host-details-page-tabs', 'Traces', <TraceTab key="traces" />, 100);