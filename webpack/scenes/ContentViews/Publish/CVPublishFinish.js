import { STATUS } from 'foremanReact/constants';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Bullseye, Button, Grid, GridItem } from '@patternfly/react-core';
import { ChartDonut } from '@patternfly/react-charts';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { translate as __ } from 'foremanReact/common/I18n';
import {
  selectPublishContentViewsError, selectPublishContentViews,
  selectPublishContentViewStatus,
} from './ContentViewPublishSelectors';
import { selectPublishTaskPoll, selectPublishTaskPollStatus } from '../Details/ContentViewDetailSelectors';
import getContentViews, { publishContentView } from '../ContentViewsActions';
import Loading from '../../../components/Loading';
import EmptyStateMessage from '../../../components/Table/EmptyStateMessage';
import { cvVersionPublishKey } from '../ContentViewsConstants';
import { startPollingTask, stopPollingTask, toastTaskFinished } from '../../Tasks/TaskActions';
import getContentViewDetails from '../Details/ContentViewDetailActions';


const CVPublishFinish = ({
  cvId,
  userCheckedItems, setUserCheckedItems,
  forcePromote, description, setDescription,
  setIsOpen, versionCount, currentStep, setCurrentStep,
}) => {
  const dispatch = useDispatch();
  const [publishDispatched, setPublishDispatched] = useState(false);
  const [saving, setSaving] = useState(true);
  const [polling, setPolling] = useState(false);
  const [taskErrored, setTaskErrored] = useState(false);
  const response = useSelector(state => selectPublishContentViews(state, cvId, versionCount));
  const status = useSelector(state => selectPublishContentViewStatus(state, cvId, versionCount));
  const error = useSelector(state => selectPublishContentViewsError(state, cvId, versionCount));
  const pollResponse = useSelector(state =>
    selectPublishTaskPoll(state, cvVersionPublishKey(cvId, versionCount)), shallowEqual);
  const pollResponseStatus = useSelector(state =>
    selectPublishTaskPollStatus(state, cvVersionPublishKey(cvId, versionCount)), shallowEqual);

  const pollPublishTask = (cvPublishVersionKey, task) => {
    if (!polling) dispatch(startPollingTask(cvPublishVersionKey, task));
  };

  const progressCompleted = () => (pollResponse.progress ? pollResponse.progress * 100 : 0);

  const handleEndTask = ({ taskComplete }) => {
    if (currentStep !== 1) {
      dispatch(stopPollingTask(cvVersionPublishKey(cvId, versionCount)));
      setCurrentStep(1);
      setIsOpen(false);
      if (taskComplete) {
        dispatch(getContentViewDetails(cvId));
        dispatch(getContentViews);
        dispatch(toastTaskFinished(pollResponse));
      }
    }
  };


  useEffect(() => {
    if (currentStep !== 3 && !publishDispatched) {
      setCurrentStep(3);
      setSaving(true);
      setPublishDispatched(true);
      dispatch(publishContentView({
        id: cvId,
        versionCount,
        description,
        environment_ids: userCheckedItems.map(item => item.id),
        is_force_promote: (forcePromote.length > 0),
      }));
      setDescription('');
      setUserCheckedItems([]);
    }
  }, [dispatch, setSaving, publishDispatched, setPublishDispatched,
    setDescription, setUserCheckedItems, currentStep, setCurrentStep,
    cvId, versionCount, description, forcePromote, userCheckedItems]);

  useEffect(() => {
    if (!response) return;
    setSaving(true);
    const { id } = response;
    if (id && status === STATUS.RESOLVED) {
      setSaving(false);
      pollPublishTask(cvVersionPublishKey(cvId, versionCount), response);
      setPolling(true);
    } else if (status === STATUS.ERROR) {
      setSaving(false);
    }
  }, [JSON.stringify(response), status, error, cvId, versionCount,
    pollPublishTask, setPolling, setSaving]);


  useEffect(() => {
    const { state, result } = pollResponse;
    if (state === 'paused' || result === 'error') {
      setTaskErrored(true);
      setTimeout(() => {
        handleEndTask({ taskComplete: true });
      }, 500);
    }
    if (state === 'stopped' && result === 'success') {
      setTimeout(() => {
        handleEndTask({ taskComplete: true });
      }, 500);
    }
  }, [JSON.stringify(pollResponse), dispatch, setTaskErrored,
    setPolling, setIsOpen, pollResponseStatus, handleEndTask]);

  if (saving) {
    return <Loading />;
  }
  if (polling && pollResponse) {
    return (
      <Grid hasGutter>
        <GridItem span={12} rowSpan={11}>
          <Bullseye>
            <div style={{ height: '500px', width: '500px' }}>
              <ChartDonut
                ariaDesc={__('Publishing Content View')}
                ariaTitle={__('Publishing Content View')}
                animate={{ duration: 100 }}
                data={[{ x: 'Completed', y: progressCompleted() }, { x: 'Pending', y: 100 - progressCompleted() }]}
                labels={({ datum }) => `${datum.x}: ${datum.y.toFixed(0)}%`}
                title={pollResponse.progress ? `${progressCompleted().toFixed(0)} %` : 'Starting..'}
                colorScale={taskErrored ? ['#FF0000', '#F08080'] : ['#008000', '#8FBC8F']}
              />
            </div>
          </Bullseye>
        </GridItem>
        <GridItem span={12} rowSpan={1}>
          <Bullseye>
            <Button
              onClick={() => {
                handleEndTask({ taskComplete: false });
              }}
              variant="primary"
              aria-label="publish_content_view"
            >
              Close
            </Button>
            <Button
              component="a"
              aria-label="view tasks button"
              href={`/foreman_tasks/tasks/${pollResponse.id}`}
              target="_blank"
              variant="link"
            >
              {' View task details '}
              <ExternalLinkAltIcon />
            </Button>
          </Bullseye>
        </GridItem>
      </Grid>
    );
  }
  if (status === STATUS.PENDING) return (<Loading />);
  if (status === STATUS.ERROR) return (<EmptyStateMessage error={error} />);
  return <Loading />;
};

CVPublishFinish.propTypes = {
  cvId: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]).isRequired,
  forcePromote: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  description: PropTypes.string.isRequired,
  setDescription: PropTypes.func.isRequired,
  userCheckedItems: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setUserCheckedItems: PropTypes.func.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  versionCount: PropTypes.number.isRequired,
  currentStep: PropTypes.number.isRequired,
  setCurrentStep: PropTypes.func.isRequired,
};


export default CVPublishFinish;
