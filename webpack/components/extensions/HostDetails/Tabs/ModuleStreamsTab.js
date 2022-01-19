import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Split, SplitItem, ActionList, ActionListItem, Dropdown,
  DropdownItem, KebabToggle, Skeleton, Tooltip, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { LongArrowAltUpIcon, CheckIcon } from '@patternfly/react-icons';
import {
  TableVariant,
  TableText,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@patternfly/react-table';
import { translate as __ } from 'foremanReact/common/I18n';
import { selectAPIResponse } from 'foremanReact/redux/API/APISelectors';
import IsoDate from 'foremanReact/components/common/dates/IsoDate';
import { urlBuilder } from 'foremanReact/common/urlHelpers';
import { propsToCamelCase } from 'foremanReact/common/helpers';
import { isEmpty } from 'lodash';
import SelectableDropdown from '../../../SelectableDropdown';
import { useSet, useBulkSelect } from '../../../../components/Table/TableHooks';
import TableWrapper from '../../../../components/Table/TableWrapper';
import { ErrataType, ErrataSeverity } from '../../../../components/Errata';
import { getHostModuleStreams } from './ModuleStreamActions';
import ErratumExpansionDetail from './ErratumExpansionDetail';
import ErratumExpansionContents from './ErratumExpansionContents';
import { selectModuleStreamStatus } from './ModuleStreamSelectors';
import { MODULE_STREAMS_KEY } from './ModuleStreamConstants';
import './ErrataTab.scss';

export const ModuleStreamTab = () => {
  const hostDetails = useSelector(state => selectAPIResponse(state, 'HOST_DETAILS'));
  const {
    id: hostId,
    content_facet_attributes: contentFacetAttributes,
  } = hostDetails;
  const contentFacet = propsToCamelCase(contentFacetAttributes ?? {});
  const dispatch = useDispatch();
  const emptyContentTitle = __('This host does not have any installable errata.');
  const emptyContentBody = __('Installable errata will appear here when available.');
  const emptySearchTitle = __('No matching errata found');
  const emptySearchBody = __('Try changing your search settings.');
  const columnHeaders = [
    __('Name'),
    __('State'),
    __('Stream'),
    __('Installation status'),
    __('Installed profile'),
  ];

  const fetchItems = useCallback(
    (params) => {
      if (!hostId) return null;
      return getHostModuleStreams(
        hostId,
        {
        },
      );
    },
    [hostId],
  );

  const response = useSelector(state => selectAPIResponse(state, MODULE_STREAMS_KEY));
  const { results, ...metadata } = response;
  const status = useSelector(state => selectModuleStreamStatus(state));
  const {
    selectOne, isSelected, searchQuery, selectedCount, isSelectable,
    updateSearchQuery, selectNone, fetchBulkParams, ...selectAll
  } = useBulkSelect({
    results,
    metadata,
    isSelectable: result => false,
  });

  if (!hostId) return <Skeleton />;

  const rowActions = [
    {
      title: __('Install'), disabled: true,
    },
    {
      title: __('Update'), disabled: true,
    },
    {
      title: __('Enable'), disabled: true,
    },
    {
      title: __('Disable'), disabled: true,
    },
    {
      title: __('Reset'), disabled: true,
    },
    {
      title: __('Remove'), disabled: true,
    },
  ];
  
  return (
    <div>
      <div id="errata-tab">
        <TableWrapper
          {...{
                metadata,
                emptyContentTitle,
                emptyContentBody,
                emptySearchTitle,
                emptySearchBody,
                status,
                rowActions,
                searchQuery,
                updateSearchQuery,
                selectedCount,
                selectNone,
                }
          }
          additionalListeners={[
            hostId]}
          fetchItems={fetchItems}
          autocompleteEndpoint={`/hosts/${hostId}/module_streams/auto_complete_search`}
          foremanApiAutoComplete
          rowsCount={results?.length}
          variant={TableVariant.compact}
        >
          <Thead>
            <Tr>
              <Th key="select-all" />
              {columnHeaders.map(col =>
                <Th key={col}>{col}</Th>)}
              <Th />
            </Tr>
          </Thead>
          <>
            {results?.map((moduleStream, rowIndex) => {
              const {
                id,
                status: moduleStreamStatus,
                name,
                stream,
                installed_profiles,
                install_status,
              } = moduleStream;

              let streamStatus = moduleStreamStatus.charAt(0).toUpperCase() + moduleStreamStatus.slice(1)
              streamStatus = streamStatus.replace("Unknown", "Default")
              let installedProfile = installed_profiles
              let installStatus = install_status
              if (installed_profiles.length === 0) {
                installedProfile = 'No profile installed'
              }
              if (installed_profiles.length > 0) {
                installedProfile = installed_profiles.map(x => x[0].toUpperCase() + x.substr(1))
                installedProfile = installedProfile.join(', ')
              }
              

              return (
                <Tbody key={`${id}`}>
                  <Tr>
                    <Td select={{
                        disable: !isSelectable(id),
                        isSelected: isSelected(id),
                        onSelect: (event, selected) => selectOne(selected, id),
                        rowIndex,
                        variant: 'checkbox',
                        }}
                    />
                    <Td>
                      {name}
                    </Td>
                    <Td>
                    {streamStatus}
                    </Td>
                    <Td>
                      {stream}
                    </Td>
                    <Td>
                      {installStatus}
                    </Td>
                    <Td>
                      {installedProfile}
                    </Td>
                    <Td
                      key={`rowActions-${id}`}
                      actions={{
                          items: rowActions,
                        }}
                    />
                  </Tr>
                </Tbody>
                );
              })
              }
          </>
        </TableWrapper>
      </div>
    </div>
  );
};

export default ModuleStreamTab;
