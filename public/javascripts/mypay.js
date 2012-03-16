function round (n, places) {
  power = parseInt ( Math.pow (10, places))
  return Math.round(n*power) / power;
}

function calcGross () {
  if (( $ ("#inhand").val () == '') || ( $ ("#investment").val () == '') || ( $ ("#misc_benefits").val ()=='')) {
    $ ("#gross").empty ();
    clearBreakup ();
    return ;
  }
  
  var ih = parseInt ( $ ("#inhand").val ());
  var iv = Math.min (1.0, parseFloat ( $ ("#investment").val ()));
  var m = parseFloat ( $ ("#misc_benefits").val ());
  
  if (ih < 10 || ih > 1e3) {
    $ ("#gross").empty ();
    clearBreakup ();
    return ;
  }

  $.ajax ({
    url: '/calc',
    type: "POST",
    data: {
      inhand: ih,
      investment: iv,
      misc: m
    },
    success: function (data) {
      var orig_gross = parseInt (data)
      var gross = round ( orig_gross / 1e5, 2)
      
      var igross = parseInt (gross)
      var gross2;
      if ( gross >= (igross + 0.5)) {
        gross2 = Math.round ( gross)
      }
      else {
        gross2 = igross + 0.5
      }
      
      $ ("#gross").html ( "Ask for ~" + gross + "L or ... " + gross2 + "L ;)")
      showBreakup (breakup ( orig_gross, iv*1e5, m*1e5))
    }
  })
}

function lakhs (n) {
  return ( n == Infinity) ? n : round ( n/1e5, 2) + "L";
}

function thousands (n) {
  return ( n == Infinity) ? n : round ( n/1e3, 2) + "K";
}

function clearBreakup () {
  $ ('#breakup table').empty ();
}

function showBreakup (breakup) {
  clearBreakup ();
  $.each (breakup, function (i, e) {
    html = "<tr>" + "<td>"+ e [0]+ "</td>" + "<td>"+ e [1]+ "</td>" + "</tr>"
    console.log (html)
    $ ('#breakup table').append ($ (html))
  })
}

function breakup (ctc, investment, misc) {
  
  var ret = []
  
  ret.push (["CTC", lakhs (ctc)])
  nontaxable = investment + misc
  ret.push ( ["Total Non Taxable", lakhs(nontaxable)])

  taxable = ctc - nontaxable
  ret.push ( ["Total Taxable", lakhs ( taxable)])

  slabs = [
    [[2e5, 5e5], 10.0],
    [[5e5, 10e5], 20.0],
    [[10e5, Infinity], 30.0],
  ]

  tax = slabs.reduce (function (tax, slab, i, slabs) {
    range = slab [0]
    perc = slab [1]
    range_max = range [1]
    range_min = range [0]
    max = (range_max == Infinity) ? taxable : ((( taxable >= range_min) && ( taxable <= range_max)) ? taxable : range_max)
    if ( taxable > range_min) {
      slab_tax = (max-range_min)*perc/100.0
      ret.push (["Tax for slab " + lakhs ( range_min) + " to " + lakhs ( range_max) + "(" + perc+ "%)", lakhs ( slab_tax)])
      tax += slab_tax
    }
    return tax;
  }, 0)

  ret.push (["Total Tax", lakhs ( tax)])
  
  ret.push ( [ "Inhand per month", thousands ( Math.round ( ((ctc - tax)/12.0)))])
  ret.push ( [ "Real Inhand per month(after investment)", thousands ( Math.round ( (ctc - tax - investment)/12.0))])
  
  return ret;
}

$(document).ready (function () {
  calcGross ();
  $ ('#inhand').keyup (function () {
    calcGross ();
  })
  $ ('#investment').keyup (function () {
    if (parseFloat ( $ (this).val ()) > 1.0) {
      $ (this).val(1)
    }
       
    calcGross ();
  })
  $ ('#misc_benefits').keyup (function () {
    calcGross ();
  })
})
