// Code written with assistant by DeepSeek
// Global Variables
let selection = null;

let angleSlice, svg, axes; //Star plot globals

function getContainerSize(container_id) {
    const container = document.getElementById(container_id);
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    console.log("width", width, "height", height);
    return [width, height];
}

// PIE CHART ----------------------------------------------->
function preprocessPieChart(type) {
    let pieObjects = {
        "0-51": 0,
        "51-102": 0,
        "102-153": 0,
        "153-204": 0,
        "204-255": 0,
    };

    const thresholds = [51, 102, 153, 204, 255];
    const pieScale = d3
        .scaleThreshold()
        .domain(thresholds.slice(0, -1))
        .range(Object.keys(pieObjects));

    return d3.csv("data/pokemon_alopez247.csv").then((data) => {
        data.forEach((entry) => {
            const row_type = entry["Type_1"];
            if (row_type === type || type === null) {
                const rowCatchRate = entry["Catch_Rate"];
                const key = pieScale(rowCatchRate);
                pieObjects[key] += 1;
            }
        })
        console.log("PIE OBJECTS",pieObjects);
        Object.keys(pieObjects).forEach((key) => {
            if (pieObjects[key] === 0) {
                delete pieObjects[key];
            }
        });
        return pieObjects;
    });
}

function generatePieChart(pieObjects) {        
    const containerSize = getContainerSize("pie-chart-viz");
    var width = containerSize[0];
    var height = containerSize[1];
    var margin = 40;
    var radius = Math.min(width, height) / 2 - margin;

    var container = d3.select("#pie-chart-viz");
    var svg = container.select("svg");

    if (svg.empty()) {
        svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    var g = svg.select("g");
    if (g.empty()) {
        g = svg
            .append("g")
            .attr(
                "transform",
                `translate(${width / 2},${height / 2})`
            );
    }

    svg.select(".chart-title").remove();
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", margin / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Catch Rates");

    var color = d3
        .scaleOrdinal()
        .domain(Object.keys(pieObjects))
        .range(d3.schemePaired);

    var pie = d3
        .pie()
        .value((d) => d.value)
        .sort((a, b) => d3.ascending(a.key, b.key));

    var data_ready = pie(d3.entries(pieObjects));
    var arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

    // JOIN
    var slices = g
        .selectAll("path")
        .data(data_ready, (d) => d.data.key);

    // EXIT
    slices.exit().remove();

    // ENTER
    slices
        .enter()
        .append("path")
        .attr("fill", (d) => color(d.data.key))
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 1)
        .each(function (d) {
            this._current = d; // Initialize current angle
        })
        .attr("d", arcGenerator)

    // UPDATE
    slices
        .transition()
        .duration(1000)
        .attrTween("d", function (d) {
            var interpolate = d3.interpolate(this._current || d, d);
            this._current = d;
            return (t) => arcGenerator(interpolate(t));
        });

    // LABELS
    var labels = g
        .selectAll("text")
        .data(data_ready, (d) => d.data.key);

    // EXIT labels
    labels.exit().remove();

    // ENTER labels
    labels
        .enter()
        .append("text")
        .text((d) => d.data.key)
        .style("text-anchor", "middle")
        .style("font-size", 10)
        .attr("transform", (d) => {
            const [x, y] = arcGenerator.centroid(d);
            const scaleFactor = 1.6; // Increase to push farther out
            return `translate(${x * scaleFactor}, ${
                y * scaleFactor
            })`;
        })
        .style("opacity", 1);

    // UPDATE labels
    labels
        .transition()
        .duration(1000)
        .attr("transform", (d) => {
            const [x, y] = arcGenerator.centroid(d);
            const scaleFactor = 1.6; // Increase to push farther out
            return `translate(${x * scaleFactor}, ${
                y * scaleFactor
            })`;
        });
}

// STAR CHART ----------------------------------------------->
function preprocessStarPlot(type) {
    return d3.csv("data/pokemon_alopez247.csv").then((data) => {
        let stats = {
            HP: 0,
            Attack: 0,
            Defense: 0,
            Sp_Atk: 0,
            Sp_Def: 0,
            Speed: 0,
            Count: 0,
        };

        data.forEach((entry) => {
            const row_type = entry["Type_1"];
            if (row_type === type || type === null) {
                stats["HP"] += +entry["HP"];
                stats["Attack"] += +entry["Attack"];
                stats["Defense"] += +entry["Defense"];
                stats["Sp_Atk"] += +entry["Sp_Atk"];
                stats["Sp_Def"] += +entry["Sp_Def"];
                stats["Speed"] += +entry["Speed"];
                stats["Count"] += 1;
            }
        });

        stats["HP"] = stats["HP"] / stats["Count"];
        stats["Attack"] = stats["Attack"] / stats["Count"];
        stats["Defense"] = stats["Defense"] / stats["Count"];
        stats["Sp_Atk"] = stats["Sp_Atk"] / stats["Count"];
        stats["Sp_Def"] = stats["Sp_Def"] / stats["Count"];
        stats["Speed"] = stats["Speed"] / stats["Count"];

        return stats;
    });
}

function drawStarPolygon(stats, type) {
    // const types = Object.keys(stats);

    const maxValue = 100;
    // Add scale for mental health scores
    rScale = d3
        .scaleLinear()
        .domain([0, maxValue])
        .range([0, radius]);

    // Create the line template for radar (can be reused for different shapes)
    radarLine = d3
        .lineRadial()
        .curve(d3.curveLinearClosed)
        .radius((d) => rScale(d.value))
        .angle((d, i) => angleSlice * i);

    svg.selectAll(".radar-area").remove();
    svg.selectAll(".radar-point").remove();
    // If there was a previous polygon, remove everything associated with it

    // map axis to the corresponding value
    const radarData = axes.map((axis) => ({
        axis: axis,
        value: stats[axis],
    }));

    // Create the line of the polygon and fills it with corresponding color
    svg.append("path")
        .attr("class", "radar-area")
        .datum(radarData)
        .attr("d", radarLine)
        .attr("fill", "#FF0000")
        .attr("fill-opacity", 0.3)
        .attr("stroke", "#FF0000")
        .attr("stroke-width", 1);

    // Add dots at polygon vertices (where the actual points should be)
    svg.selectAll(".radar-point")
        .data(radarData)
        .enter()
        .append("circle")
        .attr("class", "radar-point")
        .attr("r", 4)
        .attr(
            "cx",
            (d, i) =>
                rScale(d.value) *
                Math.cos(angleSlice * i - Math.PI / 2)
        )
        .attr(
            "cy",
            (d, i) =>
                rScale(d.value) *
                Math.sin(angleSlice * i - Math.PI / 2)
        )
        .attr("fill", "#FF0000");
}

function generateStarChart() {
    // Dimensions
    const containerSize = getContainerSize("star-plot-viz");
    width = containerSize[0];
    height = containerSize[1];
    margin = { top: 60, right: 100, bottom: 0, left: 110 };
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    radius = Math.min(innerWidth, innerHeight) / 2;

    // Reset div
    d3.select(`#star-plot-div`).remove();

    // Add svg
    svg = d3
        .select(`#star-plot-viz`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    svg.append("text")
        .attr("x", -width / 2 + margin.left)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Pokemon Stats");

    // Define axes of the star plot
    axes = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];

    // Math :C
    angleSlice = (Math.PI * 2) / axes.length;

    // Add the circles that represent the levels (scores of the mental illness)
    const levels = 10;
    for (let level = 1; level <= levels; level++) {
        const levelFactor = (radius * level) / levels;

        // Add circle for level (even layere the line is darker)
        svg.append("circle")
            .attr("r", levelFactor)
            .style("fill", "none")
            .style("stroke", function () {
                return level % 2 === 0 ? "#aaa" : "#ddd";
            })
            .style("stroke-width", "1px");

        // Add value of level if it's even
        if (level % 2 == 0) {
            svg.append("text")
                .attr("x", 5)
                .attr("y", -levelFactor - 1)
                .text(level * 10)
                .style("font-size", "10px")
                .style("fill", "#666")
                .style("text-anchor", "middle");
        }
    }

    // Adds each axis
    axes.forEach((axis, i) => {
        const angle = angleSlice * i - Math.PI / 2;

        // Add the line for the axis
        svg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", radius * Math.cos(angle))
            .attr("y2", radius * Math.sin(angle))
            .style("stroke", "#333")
            .style("stroke-width", "1px");

        // Add the label for the axis outside near the line
        svg.append("text")
            .attr("x", (radius + 60) * Math.cos(angle))
            .attr("y", (radius + 20) * Math.sin(angle))
            .text(axis)
            .style("font-size", "13px")
            .style("text-anchor", "middle");
    });
}

// BAR PLOT ----------------------------------------------->
function preprocessBarPlot() {
    return d3.csv("data/pokemon_alopez247.csv").then((data) => {
        let barObjects = {};

        data.forEach((entry) => {
            const pokemonType = entry["Type_1"];

            if (!barObjects.hasOwnProperty(pokemonType)) {
                barObjects[pokemonType] = {
                    Type: pokemonType,
                    Count: 1,
                };
            }
            barObjects[pokemonType]["Count"] += 1;
        });
        return barObjects;
    });
}

function generateBarPlot(barObjects) {
    // set the dimensions and margins of the graph
    const containerSize = getContainerSize("bar-graph-viz");
    const margin = { top: 30, right: 30, bottom: 70, left: 60 },
        width = (containerSize[0] - margin.left - margin.right) / 2,
        height = containerSize[1] - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3
        .select("#bar-graph-viz")
        .append("svg")
        .attr("id", "bar-graph-svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr(
            "transform",
            `translate(${margin.left}, ${margin.top})`
        );

    data = barObjects;
    // Parse the Data

    // X axis
    const x = d3
        .scaleBand()
        .range([0, width])
        .domain(data.map((d) => d.Type))
        .padding(0.2);

    const gx = svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    gx.selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    const y = d3.scaleLinear().domain([0, 120]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    // Bars
    const bars = svg
        .selectAll(".mybar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "mybar")
        .attr("x", (d) => x(d.Type))
        .attr("y", (d) => y(d.Count))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.Count))
        .attr("fill", "#3b4cca")
        .on("mouseover", function () {
            if (!d3.select(this).classed("selected")) {
                d3.select(this).attr("fill", "#ff0000");
            }
        })
        .on("mouseout", function () {
            if (!d3.select(this).classed("selected")) {
                d3.select(this).attr("fill", "#3b4cca");
            }
        })
        .on("click", function (event, d) {
            const allBars = d3.selectAll(".mybar");
            const clickedBar = d3.select(this);

            if (clickedBar.classed("selected")) {
                clickedBar
                    .classed("selected", false)
                    .attr("fill", "#3b4cca");
                selection = null;
            } else {
                allBars
                    .classed("selected", false)
                    .attr("fill", "#3b4cca");
                clickedBar
                    .classed("selected", true)
                    .attr("fill", "#ff0000");
                selection = data[d].Type;
            }

            // Update other charts
            preprocessStarPlot(selection).then((stats) =>
                drawStarPolygon(stats, selection)
            );
            preprocessPieChart(selection).then((pieObjects) =>
                generatePieChart(pieObjects)
            );
        });

    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Pokemon Type Distribution");

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 15)
        .style("text-anchor", "middle")
        .text("Pokemon Type");

    // Add Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .style("text-anchor", "middle")
        .text("Count");

    // Fixed zoom implementation for bar chart
    const zoom = d3
        .zoom()
        .scaleExtent([1, 5])
        .extent([
            [0, 0],
            [width, height],
        ])
        .translateExtent([
            [-width, 0],
            [width, height],
        ])
        .on("zoom", zoomed);

    function zoomed() {
        // Get the current zoom transform
        const transform = d3.event.transform;

        // Apply transform to bars
        bars.attr("transform", transform);

        const newRange = [
            transform.applyX(0),
            transform.applyX(width),
        ];
        const xz = d3
            .scaleBand()
            .range(newRange)
            .domain(x.domain())
            .padding(0.2);

        // Update x-axis
        gx.call(d3.axisBottom(xz))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
    }

    // Apply zoom behavior to svg
    svg.call(zoom);
}

function main() {
    preprocessBarPlot().then((barObjects) =>
        generateBarPlot(Object.values(barObjects))
    );
    generateStarChart();
    preprocessStarPlot(selection).then((stats) =>
        drawStarPolygon(stats, selection)
    );
    
    preprocessPieChart(selection).then((pieObjects) => generatePieChart(pieObjects));
}

main();

window.addEventListener("resize", function () {
    const barGraphContainer =
        document.getElementById("bar-graph-viz");
    const starPlotContainer =
        document.getElementById("star-plot-viz");
    const pieChartContainer =
        document.getElementById("pie-chart-viz");

    barGraphContainer
        .querySelectorAll("svg")
        .forEach((svg) => svg.remove());
    starPlotContainer
        .querySelectorAll("svg")
        .forEach((svg) => svg.remove());
    pieChartContainer
        .querySelectorAll("svg")
        .forEach((svg) => svg.remove());

    main();
});