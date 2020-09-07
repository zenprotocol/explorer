'use strict';

module.exports = {
  distributionMapFrom: `
    (select
      coalesce(osums.address, isums.address) as address,
      osums.output_sum,
      case
      when isums.input_sum is null
      then 0
      else isums.input_sum
      end
    from
      (select
        o.address,
        sum(o.amount) as output_sum
      from "Outputs" o
      where o.asset = :asset and o.address is not null
      group by address) as osums
      full outer join
      (select
        io.address,
        sum(io.amount) as input_sum
      from
        "Outputs" io
        join "Inputs" i
        on i."outputId" = io.id
      where io.asset = :asset and io.address is not null
      group by io.address) as isums
      on osums.address = isums.address) as bothsums
    where output_sum <> input_sum
  `,
};