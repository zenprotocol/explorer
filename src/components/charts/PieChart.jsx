import React from 'react';
import PropTypes from 'prop-types';
import Chart from './Chart';

export default function PieChart(props) {
  const {
    title,
    data,
    seriesTitle,
    tooltipHeaderFormat,
    tooltipPointFormat,
    dataLabelsFormatter,
    tooltipValueSuffix,
  } = props;

  const dataLabels = {};
  if (dataLabelsFormatter) {
    dataLabels.formatter = dataLabelsFormatter;
  }
  const config = {
    chart: {
      type: 'pie',
    },
    xAxis: {
      type: 'linear',
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
        dataLabels,
        tooltip: {
          valueSuffix: tooltipValueSuffix,
        },
      },
    ],
    tooltip: {
      headerFormat: tooltipHeaderFormat,
      pointFormat: tooltipPointFormat,
    },
  };
  return <Chart config={config} />;
}

PieChart.propTypes = {
  xAxisType: PropTypes.string,
  title: PropTypes.string,
  seriesTitle: PropTypes.string,
  data: PropTypes.array.isRequired,
  tooltipHeaderFormat: PropTypes.string,
  tooltipPointFormat: PropTypes.string,
  tooltipValueSuffix: PropTypes.string,
  dataLabelsFormatter: PropTypes.func,
};

PieChart.defaultProps = {
  xAxisType: 'datetime',
  tooltipHeaderFormat: '<span style="font-size: 10px;"><strong>{point.key}</strong></span><br/>',
  tooltipPointFormat:
    '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>',
};
