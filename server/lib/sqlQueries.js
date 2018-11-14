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
      where o.asset = :asset
      and o."lockType" <> 'Destroy'
      group by address) as osums
      full outer join
      (select
        io.address,
        sum(io.amount) as input_sum
      from
        "Outputs" io
        join "Inputs" i
        on i."OutputId" = io.id
      where io.asset = :asset
      group by io.address) as isums
      on osums.address = isums.address) as bothsums
    where output_sum <> input_sum
  `,
};