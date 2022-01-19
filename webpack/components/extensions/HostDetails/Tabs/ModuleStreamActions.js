import { API_OPERATIONS, get } from 'foremanReact/redux/API';
import {
  MODULE_STREAMS_KEY,
} from './ModuleStreamConstants';
import { foremanApi } from '../../../../services/api';

export const getHostModuleStreams = (hostId, params) => get({
  type: API_OPERATIONS.GET,
  key: MODULE_STREAMS_KEY,
  url: foremanApi.getApiUrl(`/hosts/${hostId}/module_streams`),
  params,
});
