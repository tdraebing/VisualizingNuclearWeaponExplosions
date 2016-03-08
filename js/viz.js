//Execute in strict mode
"use strict";

//
// Global Objects and Methods
//

//define date format
var format = d3.time.format("%m/%d/%Y %I:%M:%S %p");

//define date range for scatterplot
var mindate = format.parse("1/1/1944 0:00:00 AM"),
    maxdate = format.parse("1/1/2000 0:00:00 AM");

//defining sizes and scales for scatterplot
var tl_size = {'margin' : {top: 30, right: 20, bottom: 30, left: 70},
    'width' : 1150,
    'height' : 500};

var tl_height = tl_size.height - tl_size.margin.top - tl_size.margin.bottom,
    tl_width = tl_size.width - tl_size.margin.left - tl_size.margin.right;

var tl_scales = {'x' : d3.time.scale.utc()
                              .domain([mindate, maxdate])
                              .range([0, tl_width]),
                 'y' : d3.scale.log()
                              .domain([Math.pow(10, -5), Math.pow(10, 6)])
                              .range([tl_height, 0])};

//define colors for each country
var cc = {'Russia' : 'DarkRed',
          'China' : 'OrangeRed',
          'USA' : 'MidnightBlue',
          'England' : 'Teal',
          'France' : 'Cyan',
          'India' : 'Green',
          'Pakistan' : 'Lime',
          'Unknown' : 'Black'};

//extract radius
function get_radius(d, data){
    //radius for circles on map
    var radius = d3.scale.linear()
        .domain(d3.extent(data, function(d){return d['max_yield'];}))
        .range([5, 20]);

    return radius(d);
}

// Define the brush for selection
var brush = d3.svg.brush();

//TOOLTIP

// Define the div for the tooltip
var div = d3.select("#timescatter").append("div")
            .attr("class", "tooltip");

// Create text for tooltip
var tip_text = function(d){
    //check whether string formating prototype exists
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        };
    }

    //add zero for dates
    function addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    //reverse NA substitution
    function showNA(d){
        if (d == 0.0001){
            return 'NA';
        } else{
            return d;
        }
    }


    var text = "Name: {0} <br/>".format(d.name)
            + "Date: {0}.{1}.{2} {3}:{4} <br/>".format(addZero(d.datetime.getUTCDate()),
                                                    addZero(d.datetime.getUTCMonth() + 1),
                                                    d.datetime.getUTCFullYear(),
                                                    addZero(d.datetime.getUTCHours()),
                                                    addZero(d.datetime.getUTCMinutes()))
            + "Longitude: {0}<br/>".format(d.longitude)
            + "Latitude: {0}<br/>".format(d.latitude)
            + "Testing Country: {0}<br/>".format(d.Country)
            + "Maximum Yield: {0}<br/>".format(showNA(d.max_yield))
            + "Explosion Medium: {0}<br/>".format(d.medium)
            + "Confirmation: {0}<br/>".format(d.confirmation)
            + "Data Source: {0}<br/>".format(d.source);

    return text;
}

//DATA TRANSFORMATION
function loadData(d,
                  projection)  {
    var new_d = {};
    new_d['index'] = +d[''];
    if (+d['max_yield'] == 0){
        new_d['max_yield'] = 0.0001;
    } else {
        new_d['max_yield'] = +d['max_yield'];
    }
    new_d['mb'] = +d['mb'];
    new_d['latitude'] = parseFloat(d['latitude']);
    new_d['longitude'] = parseFloat(d['longitude']);
    new_d['depth'] = parseFloat(d['depth']);
    new_d['datetime'] = format.parse(d['datetime']);
    new_d['coords'] = projection([d['longitude'], d['latitude']]);
    new_d['Country'] = d.Country;
    new_d['name'] = d.name;
    new_d['medium'] = d.medium;
    new_d['confirmation'] = d.confirmation;
    new_d['source'] = d.source;
    return new_d;
}

//DATA POINT SELECTION AND FILTERING

var selectPoints = function(points, data) {
    d3.selectAll(points)
        .attr("r", function(d){return get_radius(d['max_yield'], data) + 10;})
        .attr("opacity", 0.7);

    };

var deselectPoints = function(points, data) {
    d3.selectAll(points)
        .attr("r", function(d){return get_radius(d['max_yield'],data);})
        .attr("opacity", 0.3)
        .attr("stroke", "none");
};

var selectCoord = function(coord, data) {
    d3.select(coord)
        .attr("r", function(d) {
            return get_radius(d['max_yield'],data) + 10;
        })
        .attr('fill', function(d) {
            return cc[d.Country];
        })
        .attr("opacity", 0.7);
};

var deselectCoord = function(coord, data) {
    d3.select(coord)
        .attr('r', function(d) {
            return get_radius(d['max_yield'],data);
        })
        .attr('fill', 'rgba(0, 0, 0, 0)')
        .attr('stroke', function(d) {
            return cc[d.Country];
        })
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7)
};

var onPointOver = function(point, data) {
    selectPoints([point], data);
    var coord = d3.select("div#map").select('[index="' + point.__data__.index + '"]');
    selectCoord(coord.node(), data);
};

var onPointOut = function(point, data) {
    deselectPoints([point], data);
    var coord = d3.select("div#map").select('[index="' + point.__data__.index + '"]');
    deselectCoord(coord.node(), data);
};

var onCoordOver = function(point, data) {
    console.log(data)
    var coord = d3.select("div#map").select('[index="' + point.__data__.index + '"]');
    selectCoord(coord.node(), data);
    var pointScat = d3.select("div#timescatter").select('[index="' + point.__data__.index + '"]');
    selectPoints([pointScat.node()], data);

};

var onCoordOut = function(point, data) {
    var coord = d3.select("div#map").select('[index="' + point.__data__.index + '"]');
    deselectCoord(coord.node(), data);
    var pointScat = d3.select("div#timescatter").select('[index="' + point.__data__.index + '"]');
    deselectPoints([pointScat.node()], data);
};

// Update plots for filtering purposes
function update(data){

    //for IE users...I know...WHY?
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(item) {
            var i = this.length;
            while (i--) {
                if (this[i] === item) return i;
            }
            return -1;
        };
    }

    var selectedCountries = [];

    d3.select('div#country_legend')
                            .selectAll('circle.active')
                            .each( function(d, i){
                                selectedCountries.push( d3.select(this).attr("id") );
                            });

        var brush_ext = brush.extent();

    var filtered_country = data.filter(function(d){
        if (selectedCountries.indexOf(d.Country) !== -1){
            return d;
        }
    });

    if (brush_ext[0][1] > 55000){
        var filtered = filtered_country;
    }else {
        var filtered = filtered_country.filter(function(d) {
            return d.datetime >= brush_ext[0][0]
                && d.datetime <= brush_ext[1][0]
                && d.max_yield >= brush_ext[0][1]
                && d.max_yield <= brush_ext[1][1];
        });
    }

    plot_points(filtered);
    fill_timeline(filtered_country);
}

//MAP

//create map
function map_draw(geo_data,
                  size,
                  projection) {

    //translate to screen coordinates
    var path = d3.geo.path()
        .projection(projection);

    //create svg
    var svg_map = d3.select("#map")
        .append("svg")
        .attr("width", size.width)
        .attr("height", size.height)
        .append('g')
        .attr('class', 'map');

    //create map object
    var map = svg_map.selectAll('path')
        .data(geo_data.features)
        .enter()
        .append('path')
        .attr('class', 'map_path')
        .attr('d', path)
        .style('fill', update_countries);

    //set colors of countries on map
    function update_countries(d) {
        if(cc.hasOwnProperty(d.properties.name)) {
            return cc[d.properties.name];
        } else {
            return "lightGrey";
        }
    }
}

// Adding data points
function plot_points(data) {
    // Define the div for the tooltip
    var div = d3.select("#map").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    //creating circle elements
    var circles = d3.select("#map")
                    .select("svg")
                    .selectAll("circle")
                    .data(data, function(d){return d.index;});

    //entering new circles
    var circlesEnter = circles.enter()
                                .append("circle")
                                .attr('cx', function(d) {
                                    return d.coords[0]; })
                                .attr('cy', function(d) {
                                    return d.coords[1]; })
                                .attr('r', function(d) {
                                    return get_radius(d['max_yield'], data);
                                })
                                .attr('fill', 'rgba(0, 0, 0, 0)')
                                .attr('stroke', function(d) {
                                    return cc[d.Country];
                                })
                                .attr('stroke-width', 1.5)
                                .attr('opacity', 0.7)
                                .attr('index', function(d){return d.index;})
                                .on("mouseover", function(d) {
                                    div.transition()
                                        .duration(200)
                                        .style("opacity", .9);
                                    div .html(tip_text(d))
                                        .style("left", (d3.event.pageX + 20) + "px")
                                        .style("top", (d3.event.pageY - 28) + "px");
                                    onCoordOver(this, data);
                                })
                                .on("mouseout", function(d) {
                                    div.transition()
                                        .duration(500)
                                        .style("opacity", 0);
                                    onCoordOut(this, data);
                                });

    // removing filtered out data points
    circles.exit().remove();
}

//SCATTER PLOT

//creating plot
function timeline(data){

    //Adding svg + plot
    var tl_svg = d3.select("#timescatter")
        .append("svg")
        .attr("width", tl_size.width)
        .attr("height", tl_size.height)
        .append("g")
        .attr("class", "scatter")
        .attr("transform", "translate(" + tl_size.margin.left + "," + tl_size.margin.top + ")");

    //defining and adding axes
    var xAxis = d3.svg.axis()
        .scale(tl_scales.x)
        .orient("bottom");

    tl_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + tl_height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", tl_width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Time");

    var yAxis = d3.svg.axis()
        .scale(tl_scales.y)
        .orient("left");

    tl_svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("dy", ".71em")
        .attr("y", 6)
        .style("text-anchor", "end")
        .text("Maximum Reported Yield [kt]");

    //creating and adding brush for filtering

    brush.x(tl_scales.x)
        .y(tl_scales.y)
        .on("brush", function(d){update(data);});

    tl_svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .selectAll("rect")
}

//filling scatter plot
function fill_timeline(data) {
    // Define the div for the tooltip
    var div = d3.select("#timescatter").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Create circles
    var circles = d3.select("#timescatter")
        .select("svg")
        .select('g.scatter')
        .selectAll("circle")
        .data(data, function (d) {
            return d.index;
        });

    // Enter new data
    circles.enter().append("circle")
        .attr('r', function (d) {
            return get_radius(d['max_yield'], data);
        })
        .attr("cx", function (d) {
            return tl_scales.x(d.datetime);
        })
        .attr("cy", function (d) {
            return tl_scales.y(d.max_yield);
        })
        .attr("fill", function (d) {
            return cc[d.Country];
        })
        .attr("opacity", 0.3)
        .attr('stroke', function (d) {
            return cc[d.Country];
        })
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.7)
        .attr('index', function (d) {
            return d.index;
        })
        .on("mouseover", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(tip_text(d))
                .style("left", (d3.event.pageX + 20) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            onPointOver(this, data);
        })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
            onPointOut(this, data);
        });

    // Remove excess data
    circles.exit().remove();
}

// FILTERING COUNTRIES

function country_filter(data){
    //nest data for countries
    var nest_country = d3.nest()
        .key(function(d) { return d.Country; })
        .entries(data);

    //create legend
    // Nest the entries by symbol
    var dataNest = d3.nest()
        .key(function(d) {return d.Country;})
        .entries(data);

    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 1200 - margin.left - margin.right,
        height = 140 - margin.top - margin.bottom;

    var legendSpace = width/dataNest.length;

    var legend_svg = d3.select('div#country_legend')
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height);

    // Loop through each symbol / key
    dataNest.forEach(function(d, i) {
        legend_svg.append("circle")
            .attr("cx", (legendSpace/2)+i*legendSpace)
            .attr("cy", 30)
            .attr('r', 20)
            .attr('opacity', 0.9)
            .attr('id', function(){return d.key;})
            .classed('active', true)
            .style("fill", function() {
                return cc[d.key]; })
            .on('click', function(){
                var active   = this.active ? false : true,
                    newOpacity = active ? 0.5 : 0.9;
                d3.select(this)
                    .classed('active', function(){
                        if (active){
                            return false;
                        } else{
                            return true;
                        }
                    })
                    .transition()
                    .duration(200)
                    .style("opacity", newOpacity);
                this.active = active;
                update(data);
                });

        legend_svg.append("text")
            .attr("x", (legendSpace/2)+i*legendSpace)
            .attr("y", 75)
            .attr("class", "legend")
            .text(d.key);

    });

}

// COUNTRY SELECTION BUTTONS

function country_buttons(data){
    function deselect_Countries(){
        d3.select('#country_legend')
            .selectAll('circle')
            .classed('active', false)
            .transition()
            .duration(200)
            .style("opacity", 0.5);
        update(data);
    }

    function select_Countries(){
        d3.select('#country_legend')
            .selectAll('circle')
            .classed('active', true)
            .transition()
            .duration(200)
            .style("opacity", 0.9);
        update(data);
    }

    //create button for deselecting all
    d3.select('div#b_deselect')
        .append('input')
        .attr('type', 'button')
        .attr("name", "deselectAll")
        .attr("value", "Deselect all Countries")
        .attr("class", "block")
        .on("click", deselect_Countries);

    //create button for selecting all
    d3.select('div#b_select')
        .append('input')
        .attr('type', 'button')
        .attr("name", "selectAll")
        .attr("value", "Select all Countries")
        .attr("class", "block")
        .on("click", select_Countries);
}

// REMOVE SELECTION

function selection_removal(data) {
    d3.select('div#bc_selection')
        .append('input')
        .attr('type', 'button')
        .attr("name", "rmFilter")
        .attr("value", "Remove Selection")
        .attr("class", "block")
        .on("click", function(){
            d3.selectAll(".brush").call(brush.clear());
            update(data)
        });

}

// FILTER REMOVAL

function filter_removal(data) {
    //reverse filters
    function remove_filters() {
        plot_points(data);
        fill_timeline(data);
        d3.selectAll(".brush").call(brush.clear());
    }

    //create button for removing filters
    d3.select('div#bc_all')
        .append('input')
        .attr('type', 'button')
        .attr("name", "rmFilter")
        .attr("value", "Remove all Filters")
        .attr("class", "block")
        .on("click", remove_filters);
}

// DRAW VISUALIZATION

function draw(){
    //define map parameters
    //set figure proportions

    var size_map = {'margin' : 20,
        'width' : 1200,
        'height' : 700};

    //define map projection
    var projection = d3.geo.mercator()
        .scale(185)
        .translate([(size_map.width - size_map.margin) / 2.05,
            (size_map.height - size_map.margin) / 1.6]);

    //draw map
    d3.json("./data/map/world_countries.json",
        function (d){
            map_draw(d,
                size_map,
                projection)
        });

    //create data dependent objects
    d3.csv("./data/preproc_nuclear_weapon_tests.csv",
        function (d) {
            return loadData(d, projection);
        },
        function (d) {
            country_filter(d);
            country_buttons(d);
            selection_removal(d);
            filter_removal(d);
            plot_points(d);
            timeline(d);
            fill_timeline(d);
        });

}
