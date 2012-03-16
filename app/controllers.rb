def worth(ctc, investment=0, misc_nontaxable_benefits=0, slabtype=:new)
  nontaxable = investment + misc_nontaxable_benefits
  taxable = ctc - nontaxable
  inf = (1/0.0)
  slabs = {
    :old => [
           [1.8e5..5e5, 10.0],
           [5e5..8e5, 20.0],
           [8e5..inf, 30.0]
            ],
    :new => [
           [2e5..5e5, 10.0],
           [5e5..10e5, 20.0],
           [10e5..inf, 30.0]
          ]
  }[slabtype]  

  tax = slabs.reduce(0) do |tax, slab|
    range, perc = slab
    max = (range.max == inf) ? taxable : (range.include?(taxable) ? taxable : range.max)
    if taxable > range.min
      tax += (max-range.min)*perc/100.0
    end
    tax
  end

  {
    :inhand => ((ctc - tax)/12.0).round,
    :actual_inhand => ((ctc - tax - investment)/12.0).round
  }
end

def ctc(target_inhand_per_month, investment, misc_benefits, slabtype=:new)
  min = target_inhand_per_month*12
  max = min*1.5

  loop {
    mid = (min+max)/2.0
    break mid if (min-max).abs < 1
    inhand = worth(mid, investment, misc_benefits, slabtype)[:actual_inhand]
    if inhand > target_inhand_per_month
      max = mid
    else
      min = mid
    end
  }.round
end

Mypay.controllers  do
  get '/' do
    render 'home.html.erb'
  end

  post '/calc' do
    inhand = params["inhand"].to_i.abs * 1e3
    investment = params["investment"].to_f.abs * 1e5
    misc = params["misc"].to_f.abs * 1e5
    puts [inhand, investment, misc].inspect
    ctc(inhand, investment, misc).to_s
  end
end
