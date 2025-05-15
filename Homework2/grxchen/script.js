// STAR/RADAR PLOT FUNCTIONS ----------------------------------------------->
let svg,
    rScale,
    angleSlice,
    radarLine,
    axes,
    width,
    height,
    margin,
    innerWidth,
    innerHeight,
    radius;

const colors = [
    "#5E81AC",
    "#EBCB8B",
    "#A3BE8C",
    "#B48EAD",
    "#D08770",
    "#8FBCBB",
    "#BF616A",
    "#EBA0AC",
    "#81A1C1",
    "#D8DEE9",
    "#88C0D0",
    "#B16286",
    "#EBCB8B",
    "#8A9E5D",
    "#C9826E",
    "#5D80AE",
];

function preprocessStarData() {
    return d3.csv("data/mxmh.csv").then((data) => {
        let musicGenreSums = {};

        data.forEach((entry) => {
            const genre = entry["Fav genre"];
            if (genre) {
                if (musicGenreSums.hasOwnProperty(genre)) {
                    musicGenreSums[genre]["Anxiety"] +=
                        +entry["Anxiety"];
                    musicGenreSums[genre]["Depression"] +=
                        +entry["Depression"];
                    musicGenreSums[genre]["Insomnia"] +=
                        +entry["Insomnia"];
                    musicGenreSums[genre]["OCD"] += +entry["OCD"];
                    total =
                        +entry["Anxiety"] +
                        +entry["Depression"] +
                        +entry["Insomnia"] +
                        +entry["OCD"];
                    musicGenreSums[genre]["Overall"] += total / 4;
                    musicGenreSums[genre]["Count"] += 1;
                } else {
                    musicGenreSums[genre] = {
                        Anxiety: +entry["Anxiety"],
                        Depression: +entry["Depression"],
                        Insomnia: +entry["Insomnia"],
                        OCD: +entry["OCD"],
                        Overall:
                            (+entry["Anxiety"] +
                                +entry["Depression"] +
                                +entry["Insomnia"] +
                                +entry["OCD"]) /
                            4,
                        Count: 1,
                    };
                }
            }
        });

        let musicGenreStarObjects = {};
        for (const genre in musicGenreSums) {
            const count = musicGenreSums[genre]["Count"];
            musicGenreStarObjects[genre] = {
                "Anxiety Avg. (0-10)":
                    musicGenreSums[genre]["Anxiety"] / count,
                "Depression Avg. (0-10)":
                    musicGenreSums[genre]["Depression"] / count,
                "Insomnia Avg. (0-10)":
                    musicGenreSums[genre]["Insomnia"] / count,
                "OCD Avg. (0-10)":
                    musicGenreSums[genre]["OCD"] / count,
                "Overall Avg. (0-10)":
                    musicGenreSums[genre]["Overall"] / count,
            };
        }

        return musicGenreStarObjects;
    });
}

function drawStarPolygon(
    musicGenreStarObjects,
    genre,
    axes,
    svg,
    rScale,
    angleSlice,
    radarLine,
    colors
) {
    const genres = Object.keys(musicGenreStarObjects);

    const colorsDict = genres.reduce((acc, genre, i) => {
        acc[genre] = colors[i % colors.length];
        return acc;
    }, {});

    svg.selectAll(".radar-area").remove();
    svg.selectAll(".radar-point").remove();
    svg.selectAll(".radar-genre-title").remove();

    const radarData = axes.map((axis) => ({
        axis: axis,
        value: musicGenreStarObjects[genre][axis],
    }));

    svg.append("path")
        .attr("class", "radar-area")
        .datum(radarData)
        .attr("d", radarLine)
        .attr("fill", colorsDict[genre])
        .attr("fill-opacity", 0.3)
        .attr("stroke", colorsDict[genre])
        .attr("stroke-width", 1);

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
        .attr("fill", colorsDict[genre]);

    svg.append("text")
        .attr("class", "radar-genre-title")
        .attr("x", (-width / 2) + 40)
        .attr("y", (-height / 2) + 50)
        .attr("text-anchor", "left")
        .style("font-size", "15px")
        .style("font-weight", "normal")
        .text(genre);

    svg.append("rect")
        .attr("x", -width / 2 + 15)
        .attr("y", -height / 2 + 35)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", colorsDict[genre])
        .attr("stroke", "black")
        .attr("stroke-width", 2);
}

function generateStarChart(musicGenreStarObjects, selectedGenre) {
    
    width = 500;
    height = 500;
    margin = { top: 60, right: 100, bottom: 60, left: 130 };
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    radius = Math.min(innerWidth, innerHeight) / 2;

    d3.select(`#star_plot svg`).remove();

    svg = d3
        .select(`#star_plot`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    axes = [
        "Anxiety Avg. (0-10)",
        "Depression Avg. (0-10)",
        "Insomnia Avg. (0-10)",
        "OCD Avg. (0-10)",
        "Overall Avg. (0-10)",
    ];
    const maxValue = 10;
    angleSlice = (Math.PI * 2) / axes.length;

    rScale = d3
        .scaleLinear()
        .domain([0, maxValue])
        .range([0, radius]);

    const levels = 10;
    for (let level = 1; level <= levels; level++) {
        const levelFactor = (radius * level) / levels;

        svg.append("circle")
            .attr("r", levelFactor)
            .style("fill", "none")
            .style("stroke", function () {
                return level % 2 === 0 ? "#aaa" : "#ddd";
            })
            .style("stroke-width", "1px");

        if (level % 2 == 0) {
            svg.append("text")
                .attr("x", 5)
                .attr("y", -levelFactor + 3)
                .text(level)
                .style("font-size", "10px")
                .style("fill", "#666")
                .style("text-anchor", "middle");
        }
    }

    axes.forEach((axis, i) => {
        const angle = angleSlice * i - Math.PI / 2;

        svg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", radius * Math.cos(angle))
            .attr("y2", radius * Math.sin(angle))
            .style("stroke", "#333")
            .style("stroke-width", "1px");

        svg.append("text")
            .attr("x", (radius + 60) * Math.cos(angle))
            .attr("y", (radius + 20) * Math.sin(angle))
            .text(axis)
            .style("font-size", "12px")
            .style("text-anchor", "middle");
    });

    radarLine = d3
        .lineRadial()
        .curve(d3.curveLinearClosed)
        .radius((d) => rScale(d.value))
        .angle((d, i) => angleSlice * i);

    drawStarPolygon(
        musicGenreStarObjects,
        selectedGenre,
        axes,
        svg,
        rScale,
        angleSlice,
        radarLine,
        colors
    );
}

function populateGenreDropdown(musicGenreStarObjects) {
    const genres = Object.keys(musicGenreStarObjects);
    const dropdown = d3.select("#genre-select");

    genres.forEach((genre) => {
        dropdown.append("option").attr("value", genre).text(genre);
    });

    return genres[0];
}

// STACKED BAR PLOT FUNCTIONS ----------------------------------------------->
function preprocessBarPlot(){
    return d3.csv("data/mxmh.csv").then((data) => {
        let stackedBarObjects = {};

        data.forEach((entry) => {
            const hoursPerDay = entry["Hours per day"];
            let bucketMin;

            // Modified quantize scale - groups 14+ together
            if (hoursPerDay < 14) {
                const quantizeScale = d3
                    .scaleQuantize()
                    .domain([0, 14])
                    .range([0, 2, 4, 6, 8, 10, 12]);
                bucketMin = quantizeScale(hoursPerDay);
            } else {
                bucketMin = 14; // All 14+ goes in one group
            }

            if (!stackedBarObjects.hasOwnProperty(bucketMin)) {
                const groupLabel =
                    bucketMin === 14
                        ? "14 - 24"
                        : `${bucketMin} - ${bucketMin + 2}`;
                stackedBarObjects[bucketMin] = {
                    Group: groupLabel,
                    Anxiety: 0,
                    Depression: 0,
                    Insomnia: 0,
                    OCD: 0,
                    None: 0,
                };
            }

            if (+entry["Anxiety"] >= 5) {
                stackedBarObjects[bucketMin]["Anxiety"] += 1;
            }
            if (+entry["Depression"] >= 5) {
                stackedBarObjects[bucketMin]["Depression"] += 1;
            }
            if (+entry["Insomnia"] >= 5) {
                stackedBarObjects[bucketMin]["Insomnia"] += 1;
            }
            if (+entry["OCD"] >= 5) {
                stackedBarObjects[bucketMin]["OCD"] += 1;
            }
            if (
                +entry["Anxiety"] < 5 &&
                +entry["Depression"] < 5 &&
                +entry["Insomnia"] < 5 &&
                +entry["OCD"] < 5
            ) {        
                stackedBarObjects[bucketMin]["None"] += 1;
            }
        });

        console.log("Stacked Bars", stackedBarObjects)
        return stackedBarObjects;
    });
}
function generateBarPlot(data) {
    console.log("param", data)
    // Set the dimensions and margins of the graph
    var margin = { top: 30, right: 30, bottom: 30, left: 30 },
        width = 600 - margin.left - margin.right,
        height = 555 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    var svg = d3
        .select("#stacked_bar_plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr(
            "transform",
            "translate(" + margin.left + "," + margin.top + ")"
        );

    // List of subgroups = header of the csv files = nitrogen, normal, stress
    var subgroups = ["Anxiety", "Depression", "Insomnia", "OCD", "None"];

    // List of groups = species here = value of the first column called group -> I show them on the X axis
    var groups = data.map(function (d) {
        return d.Group;
    });

    // Add X axis
    var x = d3
        .scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add Y axis
    var y = d3.scaleLinear().domain([0, 600]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    // Color palette = one color per subgroup
    var color = d3
        .scaleOrdinal()
        .domain(subgroups)
        .range([
            "#8dd3c7",
            "#ffffb3",
            "#bebada",
            "#fb8072",
            "#80b1d3",
        ]);

    // Stack the data --> stack per subgroup
    var stackedData = d3.stack().keys(subgroups)(data);

    // Show the bars
    svg.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", function (d) {
            return color(d.key);
        })
        .selectAll("rect")
        // Enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function (d) {
            return d;
        })
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return x(d.data.Group);
        })
        .attr("y", function (d) {
            return y(d[1]);
        })
        .attr("height", function (d) {
            return y(d[0]) - y(d[1]);
        })
        .attr("width", x.bandwidth());
}

// PIE CHART FUNCTIONS ----------------------------------------------->
function preprocessHeatMap() {
    return d3.csv("data/mxmh.csv").then((data) => {
        // Convert frequency text to numerical values
        const frequencyMap = {
            "Never": 0,
            "Rarely": 25,
            "Sometimes": 50,
            "Very frequently": 100,
        };

        // Extract all unique genres from column names
        const genres = [
            "Classical",
            "Country",
            "EDM",
            "Folk",
            "Gospel",
            "Hip hop",
            "Jazz",
            "K pop",
            "Latin",
            "Lofi",
            "Metal",
            "Pop",
            "R&B",
            "Rap",
            "Rock",
            "Video game music",
        ];

        // Process each row
        const processedData = data.map((row) => {
            const processedRow = {
                // Basic numerical data
                Age: +row.Age,
                HoursPerDay: +row["Hours per day"] || 0,
                BPM: +row.BPM || 0,

                // Convert frequency columns to numerical values
                ...genres.reduce((acc, genre) => {
                    const freqKey = `Frequency [${genre}]`;
                    acc[`Freq_${genre.replace(/\s+/g, "")}`] =
                        frequencyMap[row[freqKey]] || 0;
                    return acc;
                }, {}),

                // Mental health metrics
                Anxiety: +row.Anxiety || 0,
                OCD: +row.OCD || 0,
                Depression: +row.Depression || 0,
                Insomnia: +row.Insomnia || 0,
            };
            return processedRow;
        });

        // Calculate correlation matrix
        const xVars = [
            "Age",
            "HoursPerDay",
            "BPM",
            ...genres.map(
                (genre) => `Freq_${genre.replace(/\s+/g, "")}`
            ),
        ];

        const yVars = ["Anxiety", "OCD", "Depression", "Insomnia"];

        const correlationData = [];

        xVars.forEach((xVar) => {
            yVars.forEach((yVar) => {
                console.log(xVar, yVar)
                const correlation = calculateCorrelation(
                    processedData.map((d) => d[xVar]),
                    processedData.map((d) => d[yVar])
                );

                correlationData.push({
                    x: xVar,
                    y: yVar,
                    value: correlation,
                });
            });
        });

        return {
            xVars: xVars,
            yVars: yVars,
            correlationData: correlationData,
        };
    });
}

// Helper function to calculate Pearson correlation
function calculateCorrelation(x, y) {
    console.log(x, y)
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    // Calculate means
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    // Calculate covariance and variances
    let cov = 0,
        varX = 0,
        varY = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        cov += dx * dy;
        varX += dx * dx;
        varY += dy * dy;
    }

    // Handle division by zero
    if (varX === 0 || varY === 0) return 0;

    return cov / Math.sqrt(varX * varY);
}

function generateHeatMap(heatmapData) {
    // Set the dimensions and margins of the graph
    const margin = { top: 30, right: 30, bottom: 100, left: 100 }; // Increased bottom and left margins for labels
    const width = 1300 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Append the svg object
    const svg = d3
        .select("#heat_map")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Use the variables from the preprocessed data
    const myGroups = heatmapData.xVars.map((varName) => {
        // Format the variable names for display
        if (varName.startsWith("Freq_")) {
            return `Freq (${varName
                .replace("Freq_", "")
                .replace(/([A-Z])/g, " $1")
                .trim()})`;
        }
        return varName;
    });

    const myVars = heatmapData.yVars;

    // Build scales and axes
    const x = d3
        .scaleBand()
        .range([0, width])
        .domain(myGroups)
        .padding(0.01);

    const y = d3
        .scaleBand()
        .range([height, 0])
        .domain(myVars)
        .padding(0.01);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,10) rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y));

    // Diverging color scale (red-white-green)
    const colorScale = d3
        .scaleLinear()
        .domain([-0.2, 0, 0.2]) // Negative to positive values
        .range(["#d73027", "#ffffff", "#1a9850"]); // Red -> White -> Green

    // Add cells
    svg.selectAll()
        .data(heatmapData.correlationData, (d) => `${d.x}:${d.y}`)
        .enter()
        .append("rect")
        .attr("x", (d) => {
            const displayName = d.x.startsWith("Freq_")
                ? `Freq (${d.x
                      .replace("Freq_", "")
                      .replace(/([A-Z])/g, " $1")
                      .trim()})`
                : d.x;
            return x(displayName);
        })
        .attr("y", (d) => y(d.y))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", (d) => colorScale(d.value))
        .style("stroke", "#ddd")
        .style("stroke-width", "0.5px")
        .append("title") // Add tooltip
        .text(
            (d) =>
                `Correlation between ${d.x} and ${
                    d.y
                }: ${d.value.toFixed(2)}`
        );

    // Add legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendMargin = { top: 0, right: 30, bottom: 30, left: 30 };

    const legendSvg = d3
        .select("#heat_map")
        .append("svg")
        .attr(
            "width",
            legendWidth + legendMargin.left + legendMargin.right
        )
        .attr(
            "height",
            legendHeight + legendMargin.top + legendMargin.bottom
        )
        .append("g")
        .attr(
            "transform",
            `translate(${legendMargin.left},${legendMargin.top})`
        );

    const legendScale = d3
        .scaleLinear()
        .domain([-1, 1])
        .range([0, legendWidth]);

    const legendAxis = d3
        .axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f"));

    legendSvg
        .append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis);

    const defs = legendSvg.append("defs");
    const gradient = defs
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#d73027");

    gradient
        .append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#ffffff");

    gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#1a9850");

    legendSvg
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");
}
// MAIN FUNCTION ----------------------------------------------->

function main() {
    // Setup star plot 
    preprocessStarData().then((musicGenreStarObjects) => {
        d3.select("#colors").remove();

        const initialGenre = populateGenreDropdown(
            musicGenreStarObjects
        );
        generateStarChart(musicGenreStarObjects, initialGenre);

        d3.select("#genre-select").on("change", function () {
            const selectedGenre = d3.select(this).property("value");
            generateStarChart(musicGenreStarObjects, selectedGenre);
        });
    });

    // Setup stacked bar plot
    preprocessBarPlot().then((stackedBarObjects) => {
        generateBarPlot(Object.values(stackedBarObjects))
    })

    // Setup heat map
    preprocessHeatMap().then((heatMapVariables) => {
        console.log(heatMapVariables)
        generateHeatMap(heatMapVariables);
    })

}

main();
