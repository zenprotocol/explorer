import React from 'react';
import PropTypes from 'prop-types';
import Chart from './Chart.jsx';

export default function LineChart(props) {
  const { xAxisType, title, data, seriesTitle, tooltipHeaderFormat, tooltipPointFormat } = props;
  const config = {
    chart: {
      type: 'line',
    },
    xAxis: {
      type: xAxisType,
    },
    yAxis: {
      title: {
        text: title,
      },
    },
    series: [
      {
        name: seriesTitle,
        data,
      },
    ],
    tooltip: {
      headerFormat: tooltipHeaderFormat,
      pointFormat: tooltipPointFormat,
    },
  };
  return <Chart config={config} />;
}

LineChart.propTypes = {
  xAxisType: PropTypes.string,
  title: PropTypes.string,
  seriesTitle: PropTypes.string,
  data: PropTypes.array.isRequired,
  tooltipHeaderFormat: PropTypes.string,
  tooltipPointFormat: PropTypes.string,
};

LineChart.defaultProps = {
  xAxisType: 'datetime',
  tooltipHeaderFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
  tooltipPointFormat:
    '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>',
};
