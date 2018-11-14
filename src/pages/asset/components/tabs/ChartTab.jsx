import React from 'react';
import { observer } from 'mobx-react';
import contractStore from '../../../../store/ContractStore';
import RouterUtils from '../../../../lib/RouterUtils';
import { TabPanel } from '../../../../components/tabs';
import { ChartLoader } from '../../../../components/charts';

const ChartTab = observer((props) => {
  return (
    <TabPanel>
      <ChartLoader
        chartName="assetDistributionMap"
        showTitle={false}
        params={{ asset: RouterUtils.getRouteParams(props).asset }}
        externalChartData={contractStore.assetDistributionData.data}
        externalChartLoading={contractStore.assetDistributionData.loading}
      />
    </TabPanel>
  );
});
export default ChartTab;
