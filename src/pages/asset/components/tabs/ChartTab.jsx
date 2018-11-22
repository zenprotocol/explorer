import React from 'react';
import { observer } from 'mobx-react';
import assetStore from '../../../../store/AssetStore';
import RouterUtils from '../../../../lib/RouterUtils';
import { TabPanel } from '../../../../components/tabs';
import { ChartLoader } from '../../../../components/charts';

const ChartTab = observer(props => {
  const { data, loading } = assetStore.assetDistributionData;
  const { asset } = RouterUtils.getRouteParams(props);
  const count = data.length
    ? data[data.length - 1].address.toLowerCase() === 'rest'
      ? data.length - 1
      : data.length
    : 0;
  return (
    <TabPanel>
      <div>Top {count} keyholders</div>
      <ChartLoader
        chartName={asset === '00'? 'zpRichList' : 'assetDistributionMap'}
        showTitle={false}
        params={{ asset }}
        externalChartData={data}
        externalChartLoading={loading}
      />
    </TabPanel>
  );
});
export default ChartTab;
