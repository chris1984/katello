import { API_OPERATIONS, get, post } from 'foremanReact/redux/API';
import { stopInterval, withInterval } from 'foremanReact/redux/middlewares/IntervalMiddleware';
import { REX_JOB_INVOCATIONS_KEY, REX_FEATURES } from './RemoteExecutionConstants';
import { foremanApi } from '../../../../services/api';
import { errorToast, renderRexJobStartedToast } from '../../../../scenes/Tasks/helpers';
import { ERRATA_SEARCH_QUERY } from './ErrataTab/HostErrataConstants';
import { TRACES_SEARCH_QUERY } from './TracesTab/HostTracesConstants';
import { PACKAGE_SEARCH_QUERY } from './PackagesTab/YumInstallablePackagesConstants';
import { PACKAGES_SEARCH_QUERY, SELECTED_UPDATE_VERSIONS } from './PackagesTab/HostPackagesConstants';

// PARAM BUILDING
export const buildHostSearch = ({ hostname, hostSearch }) => {
  let result = hostSearch ?? `name ^ (${hostname})`;
  if (result === '') {
    // user has selected all hosts
    result = 'set? name'; // the name field is NOT NULL, so this will match all hosts
  }
  return result;
};
export const baseParams = (options) => {
  const {
    feature, hostname, hostSearch, descriptionFormat, inputs = {},
  } = options;
  const search = buildHostSearch({ hostname, hostSearch });
  return ({
    job_invocation: {
      feature,
      inputs,
      description_format: descriptionFormat,
      search_query: search,
    },
  });
};

const runCommandParams = ({ hostname, command }) =>
  baseParams({
    hostname,
    inputs: { command },
    feature: REX_FEATURES.RUN_COMMAND,
  });

const uploadProfileParams = ({ hostname }) =>
  baseParams({
    hostname,
    inputs: {},
    feature: REX_FEATURES.KATELLO_UPLOAD_PROFILE,
  });

// used when we know the package name
const katelloPackageInstallParams = ({ hostname, packageName }) =>
  baseParams({
    hostname,
    inputs: { package: packageName },
    feature: REX_FEATURES.KATELLO_PACKAGE_INSTALL,
  });

// used when we know package Id(s)
const katelloPackageInstallBySearchParams = ({
  hostname, hostSearch, search, descriptionFormat,
}) =>
  baseParams({
    hostname,
    hostSearch,
    inputs: { [PACKAGE_SEARCH_QUERY]: search },
    feature: REX_FEATURES.KATELLO_PACKAGE_INSTALL_BY_SEARCH,
    descriptionFormat,
  });

const katelloPackageRemoveParams = ({ hostname, packageName }) =>
  baseParams({
    hostname,
    inputs: { package: packageName },
    feature: REX_FEATURES.KATELLO_PACKAGE_REMOVE,
  });

const katelloPackagesRemoveParams = ({ hostname, search, descriptionFormat }) =>
  baseParams({
    hostname,
    inputs: { [PACKAGES_SEARCH_QUERY]: search },
    feature: REX_FEATURES.KATELLO_PACKAGES_REMOVE_BY_SEARCH,
    descriptionFormat,
  });

const katelloPackageRemoveBySearchParams = ({
  hostname, hostSearch, search, descriptionFormat,
}) =>
  baseParams({
    hostname,
    hostSearch,
    inputs: { [PACKAGES_SEARCH_QUERY]: search },
    feature: REX_FEATURES.KATELLO_PACKAGES_REMOVE_BY_SEARCH,
    descriptionFormat,
  });

const katelloPackageUpdateParams = ({ hostname, packageName, descriptionFormat }) =>
  baseParams({
    hostname,
    inputs: { package: packageName },
    feature: REX_FEATURES.KATELLO_PACKAGE_UPDATE,
    descriptionFormat,
  });

const katelloPackagesUpdateParams = (options) => {
  // this doesn't use baseParams so looks different from the others
  const {
    hostname, search, hostSearch, versions, descriptionFormat,
  } = options;
  const searchQuery = buildHostSearch({ hostname, hostSearch });
  return ({
    job_invocation: {
      feature: REX_FEATURES.KATELLO_PACKAGES_UPDATE_BY_SEARCH,
      inputs: { [PACKAGES_SEARCH_QUERY]: search, [SELECTED_UPDATE_VERSIONS]: versions ?? [] },
      search_query: searchQuery,
      description_format: descriptionFormat,
    },
  });
};

const katelloTracerResolveParams = ({ hostname, search }) =>
  baseParams({
    hostname,
    inputs: { [TRACES_SEARCH_QUERY]: search },
    feature: REX_FEATURES.KATELLO_HOST_TRACER_RESOLVE,
  });

const katelloHostErrataInstallParams = ({
  hostname, hostSearch, search, descriptionFormat,
}) => baseParams({
  hostname,
  hostSearch,
  inputs: { [ERRATA_SEARCH_QUERY]: search },
  feature: REX_FEATURES.KATELLO_HOST_ERRATA_INSTALL_BY_SEARCH,
  descriptionFormat,
});

const katelloModuleStreamActionsParams = ({ hostname, action, moduleSpec }) =>
  baseParams({
    hostname,
    inputs: { action, module_spec: moduleSpec },
    feature: REX_FEATURES.KATELLO_HOST_MODULE_STREAM_ACTION,
  });

const showRexToast = response => renderRexJobStartedToast(response.data);

// JOB POLLING
const pollJobKey = key => `${key}_POLL_REX_JOB`;

export const getJob = (key, jobId, handleSuccess) => get({
  key,
  url: foremanApi.getApiUrl(`/job_invocations/${jobId}`),
  handleSuccess,
});

export const startPollingJob = ({
  key, jobId, handleSuccess, interval = 1000,
}) =>
  withInterval(getJob(pollJobKey(key), jobId, handleSuccess), interval);

export const stopPollingJob = ({ key }) => stopInterval(pollJobKey(key));

// JOB INVOCATIONS
export const runCommand = ({ hostname, command, handleSuccess }) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: runCommandParams({ hostname, command }),
  handleSuccess: (response) => {
    showRexToast(response);
    if (handleSuccess) handleSuccess(response);
  },
  errorToast,
});

export const uploadProfile = ({ hostname, handleSuccess }) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: uploadProfileParams({ hostname }),
  handleSuccess: (response) => {
    showRexToast(response);
    if (handleSuccess) handleSuccess(response);
  },
  errorToast,
});

export const installPackage = ({ hostname, packageName, handleSuccess }) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloPackageInstallParams({ hostname, packageName }),
  handleSuccess: (response) => {
    showRexToast(response);
    if (handleSuccess) handleSuccess(response);
  },
  errorToast,
});

export const installPackageBySearch = ({
  hostname, hostSearch, search, descriptionFormat,
}) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloPackageInstallBySearchParams({
    hostname, hostSearch, search, descriptionFormat,
  }),
  handleSuccess: showRexToast,
  errorToast,
});

export const removePackage = ({ hostname, packageName }) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloPackageRemoveParams({ hostname, packageName }),
  handleSuccess: showRexToast,
  errorToast,
});

// Used by packages wizard
export const removePackages = ({ hostname, search, descriptionFormat }) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloPackagesRemoveParams({ hostname, search, descriptionFormat }),
  handleSuccess: showRexToast,
  errorToast,
});

export const removePackagesBySearch = ({
  hostname, hostSearch, search, descriptionFormat,
}) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloPackageRemoveBySearchParams({
    hostname, hostSearch, search, descriptionFormat,
  }),
  handleSuccess: showRexToast,
  errorToast,
});

export const updatePackage = ({ hostname, packageName }) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloPackageUpdateParams({ hostname, packageName }),
  handleSuccess: showRexToast,
  errorToast,
});

export const updatePackages = ({
  hostname, hostSearch, search, versions, descriptionFormat,
}) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloPackagesUpdateParams({
    hostname, search, hostSearch, versions, descriptionFormat,
  }),
  handleSuccess: showRexToast,
  errorToast,
});

export const resolveTraces = ({ hostname, search }) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloTracerResolveParams({ hostname, search }),
  handleSuccess: showRexToast,
  errorToast,
});

export const installErrata = ({
  hostname, hostSearch, search, descriptionFormat,
}) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloHostErrataInstallParams({
    hostname, search, hostSearch, descriptionFormat,
  }),
  handleSuccess: showRexToast,
  errorToast,
});

export const moduleStreamAction = ({ hostname, action, moduleSpec }) => post({
  type: API_OPERATIONS.POST,
  key: REX_JOB_INVOCATIONS_KEY,
  url: foremanApi.getApiUrl('/job_invocations'),
  params: katelloModuleStreamActionsParams({ hostname, action, moduleSpec }),
  handleSuccess: showRexToast,
  errorToast,
});

