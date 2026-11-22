"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),country=require("../public/country-origin.js");
test("country selector covers ISO alpha-2 codes",()=>{assert.equal(country.validCode("KE"),true);assert.equal(country.validCode("GB"),true);assert.equal(country.validCode("US"),true);assert.equal(country.validCode("XX"),false);assert.equal(country.codes.length,249);});
test("flags and names derive from the selected code",()=>{assert.equal(country.flagEmoji("KE"),"🇰🇪");assert.equal(country.flagEmoji("GB"),"🇬🇧");assert.equal(country.flagEmoji("bad"),"");assert.match(country.label("KE"),/🇰🇪.*Kenya/);});
