// Code written with assistant by DeepSeek or ChatGPT
// STAR/RADAR PLOT FUNCTIONS ----------------------------------------------->
function preprocessStarData() {
    /**
     * Preprocesses data and calculates the average mental health (anxiety, depression, etc.) associated with each music genre
     * @returns musicGenreStarObjects - objects for each genre with average score of each mental illness where people marked the genre as their favorite
     */
    return d3.csv("data/mxmh.csv").then((data) => {
        let musicGenreSums = {};

        data.forEach((entry) => {
            const genre = entry["Fav genre"];
            if (genre) {
                if (musicGenreSums.hasOwnProperty(genre)) {
                    // Add score of current survey row to genre sums
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
                    // Create sum count for music genre if it doesn't exist already
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

        // Divide the sum by the count and save to musicGenreStarObjects
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

// Declare global variables
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

// Declare color scheme associated with each genre
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
    /**
     * Draws or redraws the star polygon given the genre
     */
    const genres = Object.keys(musicGenreStarObjects);

    const colorsDict = genres.reduce((acc, genre, i) => {
        acc[genre] = colors[i % colors.length];
        return acc;
    }, {});

    svg.selectAll(".radar-area").remove();
    svg.selectAll(".radar-point").remove();
    svg.selectAll(".radar-genre-title").remove();
    // If there was a previous polygon, remove everything associated with it

    // map axis to the corresponding value
    const radarData = axes.map((axis) => ({
        axis: axis,
        value: musicGenreStarObjects[genre][axis],
    }));

    // Create the line of the polygon and fills it with corresponding color
    svg.append("path")
        .attr("class", "radar-area")
        .datum(radarData)
        .attr("d", radarLine)
        .attr("fill", colorsDict[genre])
        .attr("fill-opacity", 0.3)
        .attr("stroke", colorsDict[genre])
        .attr("stroke-width", 1);

    // Add dots at polygon verticies (where the actual points should be)
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

    // Add the genre on the top left
    svg.append("text")
        .attr("class", "radar-genre-title")
        .attr("x", -width / 2 + 35)
        .attr("y", -height / 2 + 48)
        .attr("text-anchor", "left")
        .style("font-size", "13px")
        .style("font-weight", "normal")
        .text(genre);

    // Add the color corresponding genre to top left
    svg.append("rect")
        .attr("x", -width / 2 + 15)
        .attr("y", -height / 2 + 35)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorsDict[genre])
        .attr("stroke", "black")
        .attr("stroke-width", 1);
}

function generateStarChart(musicGenreStarObjects, selectedGenre) {
    /**
     * Generates star chart and add to html body
     *
     * @params musicGenreStarObjects - objects that contain data for each star
     * @params selectedGenre - the genre selected to display
     */

    // Dimensions
    width = 350;
    height = 350;
    margin = { top: 60, right: 100, bottom: 0, left: 110 };
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    radius = Math.min(innerWidth, innerHeight) / 2;

    // Reset div
    d3.select(`#star_plot svg`).remove();

    // Add svg
    svg = d3
        .select(`#star_plot`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Define axes of the star plot
    axes = [
        "Anxiety Avg. (0-10)",
        "Depression Avg. (0-10)",
        "Insomnia Avg. (0-10)",
        "OCD Avg. (0-10)",
        "Overall Avg. (0-10)",
    ];

    // Math :C
    const maxValue = 10;
    angleSlice = (Math.PI * 2) / axes.length;

    // Add scale for mental health scores
    rScale = d3
        .scaleLinear()
        .domain([0, maxValue])
        .range([0, radius]);

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
                .attr("y", -levelFactor + 3)
                .text(level)
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
            .style("font-size", "10px")
            .style("text-anchor", "middle");
    });

    // Create the line template for radar (can be reused for different shapes)
    radarLine = d3
        .lineRadial()
        .curve(d3.curveLinearClosed)
        .radius((d) => rScale(d.value))
        .angle((d, i) => angleSlice * i);

    // call function to draw the radar polygon
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
    // Creates dropdown menu
    const genres = Object.keys(musicGenreStarObjects);
    const dropdown = d3.select("#genre-select");

    genres.forEach((genre) => {
        dropdown.append("option").attr("value", genre).text(genre);
    });

    return genres[0];
}

// STACKED BAR PLOT FUNCTIONS ----------------------------------------------->
function preprocessBarPlot() {
    /**
     * For each hours per day bucket (how long participants listen to music), we preprocess the data to count the mental illness based on how often they listen to music
     *
     * @returns stackedBarObjects - objects that represent each stack of the stacked bar plot (includes count for each mental illness and bucket name)
     */
    return d3.csv("data/mxmh.csv").then((data) => {
        let stackedBarObjects = {};

        data.forEach((entry) => {
            const hoursPerDay = entry["Hours per day"];
            let bucketMin;

            // Assign hoursPerDay to corresponding bar plot bucket (ex: 0.5 assign to 0 - 2), anything above 14 assign to 14-24
            if (hoursPerDay < 14) {
                const quantizeScale = d3
                    .scaleQuantize()
                    .domain([0, 14])
                    .range([0, 2, 4, 6, 8, 10, 12]);
                bucketMin = quantizeScale(hoursPerDay);
            } else {
                bucketMin = 14;
            }

            // If bucket does not exist, create bucket
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

            // Add one to the bucket if the participant put 5 or above on a mental illness
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
            // If user put below a 5 for all mental illness, add one to None
            if (
                +entry["Anxiety"] < 5 &&
                +entry["Depression"] < 5 &&
                +entry["Insomnia"] < 5 &&
                +entry["OCD"] < 5
            ) {
                stackedBarObjects[bucketMin]["None"] += 1;
            }
        });

        return stackedBarObjects;
    });
}

function generateBarPlot(data) {
    /**
     * Generates the pair plot and adds to HTML code
     *
     * @params data - the data of the pair plot
     */
    console.log("param", data);

    // Set the dimensions and margins of the graph
    var margin = { top: 30, right: 30, bottom: 80, left: 80 },
        width = 400 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    // Append the svg object to div with id
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

    // List of stack groups (mental illness)
    var subgroups = [
        "Anxiety",
        "Depression",
        "Insomnia",
        "OCD",
        "None",
    ];

    // List of groups
    var groups = data.map(function (d) {
        return d.Group;
    });

    // Create x axis scale
    var x = d3
        .scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);

    // Add X axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add Y axis
    var y = d3.scaleLinear().domain([0, 600]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    // Color palette- one color per subgroup
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

    // Stack the data
    var stackedData = d3.stack().keys(subgroups)(data);

    // Finally add the stacked bars
    svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", function (d) {
            return color(d.key);
        })
        .selectAll("rect")
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

    // Add X axis title
    svg.append("text")
        .attr("x", width / 2 - 10)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "normal")
        .text("Time Listening To Music Per Day (hrs)");

    // Add Y axis title
    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -35)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "normal")
        .text("Number of People")
        .attr("transform", "rotate(-90)");

    // Add legend colors
    // Anxiety
    svg.append("text")
        .attr("x", width - 50)
        .attr("y", height / 8)
        .attr("text-anchor", "left")
        .style("font-size", "13px")
        .style("font-weight", "normal")
        .text("Anxiety");

    svg.append("rect")
        .attr("x", width - 70)
        .attr("y", height / 8 - 10)
        .attr("width", 13)
        .attr("height", 13)
        .attr("fill", "#ffffb3")
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    // Depression
    svg.append("text")
        .attr("x", width - 50)
        .attr("y", height / 8 + 20)
        .attr("text-anchor", "left")
        .style("font-size", "13px")
        .style("font-weight", "normal")
        .text("Depression");

    svg.append("rect")
        .attr("x", width - 70)
        .attr("y", height / 8 + 10)
        .attr("width", 13)
        .attr("height", 13)
        .attr("fill", "#8dd3c7")
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    // Insomnia
    svg.append("text")
        .attr("x", width - 50)
        .attr("y", height / 8 + 40)
        .attr("text-anchor", "left")
        .style("font-size", "13px")
        .style("font-weight", "normal")
        .text("Insomnia");

    svg.append("rect")
        .attr("x", width - 70)
        .attr("y", height / 8 + 30)
        .attr("width", 13)
        .attr("height", 13)
        .attr("fill", "#bebada")
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    // OCD
    svg.append("text")
        .attr("x", width - 50)
        .attr("y", height / 8 + 60)
        .attr("text-anchor", "left")
        .style("font-size", "13px")
        .style("font-weight", "normal")
        .text("OCD");

    svg.append("rect")
        .attr("x", width - 70)
        .attr("y", height / 8 + 50)
        .attr("width", 13)
        .attr("height", 13)
        .attr("fill", "#fb8072")
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    // None
    svg.append("text")
        .attr("x", width - 50)
        .attr("y", height / 8 + 80)
        .attr("text-anchor", "left")
        .style("font-size", "13px")
        .style("font-weight", "normal")
        .text("None");

    svg.append("rect")
        .attr("x", width - 70)
        .attr("y", height / 8 + 70)
        .attr("width", 13)
        .attr("height", 13)
        .attr("fill", "#80b1d3")
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    // Add annotation (small note about scores)
    svg.append("text")
        .attr("x", width - 120)
        .attr("y", height / 8 + 100)
        .attr("text-anchor", "left")
        .style("font-size", "10px")
        .style("font-weight", "normal")
        .text("Note: Counted as having");

    svg.append("text")
        .attr("x", width - 120)
        .attr("y", height / 8 + 110)
        .attr("text-anchor", "left")
        .style("font-size", "10px")
        .style("font-weight", "normal")
        .text("mental illness if score >= 5");
}

// HEAT MAP FUNCTIONS ----------------------------------------------->
function preprocessHeatMap() {
    /**
     * Preprocesses data for heatmap by calculating the correlation frequnecy between variables and mental health issues.
     *
     * @returns xVars - list of all xVars
     * @returns yVars - list of all yVars
     * @returns correlationData - objects with xVar, yVar, and correlation score
     */
    return d3.csv("data/mxmh.csv").then((data) => {
        const frequencyMap = {
            Never: 0,
            Rarely: 1,
            Sometimes: 2,
            "Very frequently": 3,
        };

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

        // Convert string to integers
        // For music genre listening frequency, it is converted to numbers using frequencyMap
        const processedData = data.map((row) => {
            const processedRow = {
                Age: +row.Age,
                HoursPerDay: +row["Hours per day"],
                BPM: +row.BPM,

                ...genres.reduce((acc, genre) => {
                    const freqKey = `Frequency [${genre}]`;
                    acc[`Freq_${genre.replace(/\s+/g, "")}`] =
                        frequencyMap[row[freqKey]];
                    return acc;
                }, {}),

                Anxiety: +row.Anxiety,
                OCD: +row.OCD,
                Depression: +row.Depression,
                Insomnia: +row.Insomnia,
            };
            return processedRow;
        });

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

        // For each xVar and yVar combination, use the calculateCorrelation function to get the correlation score
        xVars.forEach((xVar) => {
            yVars.forEach((yVar) => {
                console.log(xVar, yVar);
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

        // Return processed data
        return {
            xVars: xVars,
            yVars: yVars,
            correlationData: correlationData,
        };
    });
}

// Helper function to calculate correlation scpre
function calculateCorrelation(x, y) {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    // Calculate mean of X and Y variable
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

    // For 0 in numberator or denomination, return 0
    if (varX === 0 || varY === 0) return 0;

    // Return correlation score
    return cov / Math.sqrt(varX * varY);
}

function generateHeatMap(heatmapData) {
    /**
     * Generates and displays heatmap to HTML
     *
     * @params heatmapData - data displayed in the heatmap (xVar, yVar, correlationScore)
     */

    // Set the dimensions and margins of the graph
    const margin = { top: 0, right: 30, bottom: 100, left: 100 };
    const width = 600 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Append the svg object
    const svg = d3
        .select("#heat_map")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get variable names for x axis groups
    const myGroups = heatmapData.xVars.map((varName) => {
        if (varName.startsWith("Freq_")) {
            return `Freq (${varName
                .replace("Freq_", "")
                .replace(/([A-Z])/g, " $1")
                .trim()})`;
        }
        return varName;
    });

    const myVars = heatmapData.yVars;

    // Create x axis
    const x = d3
        .scaleBand()
        .range([0, width])
        .domain(myGroups)
        .padding(0.01);

    // Create y axis
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
        .attr("transform", "translate(-10,10) rotate(-40)")
        .style("text-anchor", "end");

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y));

    // Gradient color scale (red, white, green)
    const colorScale = d3
        .scaleLinear()
        .domain([-0.25, 0, 0.25])
        .range(["#d73027", "#ffffff", "#1a9850"]);

    // Add the heatmap cells
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
        .style("stroke-width", "0.5px");

    // Legend dimensions
    const legendWidth = 120;
    const legendHeight = 10;
    const legendMargin = { top: 0, right: 30, bottom: 30, left: 30 };

    // Create a legend
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

    // Create legend scale
    const legendScale = d3
        .scaleLinear()
        .domain([-0.25, 0.25])
        .range([0, legendWidth]);

    // Create legend axis with ticks
    const legendAxis = d3
        .axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f"));

    // Add legend axis
    legendSvg
        .append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis);

    // Add gradient colors
    const defs = legendSvg.append("defs");
    const gradient = defs
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // Add red
    gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#d73027");

    // Add white
    gradient
        .append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#ffffff");

    // Add green
    gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#1a9850");

    // Append legend to svg (with gradient)
    legendSvg
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    // Add annotations for legend
    d3.select("#heat_map")
        .append("svg")
        .attr("width", legendWidth)
        .attr(
            "height",
            legendHeight + legendMargin.top + legendMargin.bottom
        )
        .append("text")
        .attr("x", legendMargin.left - 30)
        .attr("y", legendMargin.top + 15)
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .text("Correlation (Pearson)");
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
        generateBarPlot(Object.values(stackedBarObjects));
    });

    // Setup heat map
    preprocessHeatMap().then((heatMapVariables) => {
        console.log(heatMapVariables);
        generateHeatMap(heatMapVariables);
    });
}

main();
