const yaml = require("js-yaml");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget("./_data/");

  eleventyConfig.addDataExtension("yaml", (contents) =>
    yaml.safeLoad(contents)
  );

  eleventyConfig.addGlobalData("names", () => {
    const files = fs.readdirSync("_data");
    return files
      .filter((file) => file.endsWith(".yaml"))
      .map((file) => {
        return file.replace(".yaml", "");
      });
  });

  eleventyConfig.addFilter("calendar", (name, extra_rows) => {
    // open all yaml files in _data
    let files = fs.readdirSync("_data");
    files = files.filter((file) => file.endsWith(".yaml"));
    if (typeof name == "string" && name != "") {
      files = files.filter((file) => file.includes(name));
    }
    const dates = {};

    if (typeof extra_rows != "number") {
      extra_rows = 0;
    }

    function add_to_dates(dates, date, name, data) {
      // if date is not in dates, add it
      if (!dates[date]) {
        dates[date] = {};
      }
      // if name is not in dates[date], add it
      if (!dates[date][name]) {
        dates[date][name] = data;
      } else {
        // throw error if name is already in dates[date]
        throw new Error(
          `Name ${name} already in dates[${date}]. Use unique dates.`
        );
      }
    }

    files.forEach((file) => {
      // get filename without extension
      const name = file.replace(".yaml", "");
      let data = yaml.safeLoad(fs.readFileSync(`_data/${file}`, "utf8"));
      if (!data) data = {};

      // for each date
      Object.keys(data).forEach((date) => {
        // for each item in date
        let firstdate = new Date(date);
        firstdate = new Date(
          Date.UTC(
            firstdate.getUTCFullYear(),
            firstdate.getUTCMonth(),
            firstdate.getUTCDate()
          )
        );
        const thisdata = data[date];

        // string (one event for one date)
        if (typeof thisdata == "string") {
          add_to_dates(dates, firstdate, name, thisdata);
        }
        // array (multiple events in succession starting from one date)
        else {
          thisdata.forEach((item, index) => {
            // add index days to firstdate
            let thisdate = firstdate;
            if (index > 0) {
              thisdate = new Date(
                Date.UTC(
                  firstdate.getUTCFullYear(),
                  firstdate.getUTCMonth(),
                  firstdate.getUTCDate() + index
                )
              );
            }
            add_to_dates(dates, thisdate, name, item);
          });
        }
      });
    });

    // dates is now something like {"Mon Jan 29 2024 00:00:00 GMT+0000 (Greenwich Mean Time)":{"alfie":"hello","neil":"terminate"},"Tue Jan 30 2024 00:00:00 GMT+0000 (Greenwich Mean Time)":{"alfie":"world","neil":"john"}}
    // turn it into 2D array representing a calendar, starting from the first date (as a Monday)
    // first, sort dates by date
    const sorted_dates = Object.keys(dates).sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    // then, get the first date
    let first_date = new Date(sorted_dates[0]);
    let now = new Date();
    if (first_date > now || isNaN(first_date)) {
      first_date = now;
    }
    // get first Monday before first date or first date if it is a Monday
    const first_monday = new Date(
      Date.UTC(
        first_date.getUTCFullYear(),
        first_date.getUTCMonth(),
        first_date.getUTCDay() == 0 // is Sunday ?
          ? first_date.getUTCDate() - first_date.getUTCDay() + 1 - 7 // get last week's Monday
          : first_date.getUTCDate() - first_date.getUTCDay() + 1 // get this week's Monday
      )
    );
    // get last date
    let last_date = new Date(sorted_dates[sorted_dates.length - 1]);
    if (last_date < now || isNaN(last_date)) {
      last_date = now;
    }
    // get last Sunday after last date or last date if it is a Sunday
    const last_sunday = new Date(
      Date.UTC(
        last_date.getUTCFullYear(),
        last_date.getUTCMonth(),
        (last_date.getUTCDay() == 0 // sunday
          ? last_date.getUTCDate() + (0 - last_date.getUTCDay())
          : last_date.getUTCDate() + (7 - last_date.getUTCDay())) +
          extra_rows * 7
      )
    );
    calendar = [];
    // for each week
    let first = true;
    for (
      let week = first_monday;
      week <= last_sunday;
      week.setDate(week.getUTCDate() + 7)
    ) {
      // add week to calendar
      calendar.push([]);
      // for each day of week
      for (let day = 0; day < 7; day++) {
        // get date object or null if it is not in dates
        const date = new Date(week);
        date.setDate(week.getUTCDate() + day);
        const date_string = date.toString();
        const text_data = dates[date_string] || {};
        // add label with extra data if needed (i.e., first visible day of month/year)
        const date_dayofmonth = date.getUTCDate();
        const date_monthofyear = date.toLocaleString("default", {
          month: "short",
        });
        const date_year = date.getUTCFullYear();
        let date_label = date_dayofmonth;
        if (date_dayofmonth === 1 || first) {
          if (date_monthofyear === "January" || first) {
            date_label = `${date_dayofmonth} ${date_monthofyear} ${date_year}`;
            first = false;
          } else {
            date_label = `${date_dayofmonth} ${date_monthofyear}`;
          }
        }
        // add info to calendar day
        calendar[calendar.length - 1].push({
          date: date,
          date_label: date_label,
          text_data: text_data,
        });
      }
    }

    return calendar;
  });

  eleventyConfig.addFilter("flatten", (array2d) => {
    return array2d.flat();
  });

  eleventyConfig.addFilter("json", (data) => {
    return JSON.stringify(data);
  });
  eleventyConfig.addFilter("encURIcmp", (string) => {
    return encodeURIComponent(string);
  });
  eleventyConfig.addFilter("get", (obj, key) => {
    return obj[key];
  });
  eleventyConfig.addFilter("isodate", (dt) => {
    return dt.toISOString().split("T")[0];
  });
  eleventyConfig.addFilter("isodatetime", (dt) => {
    return dt.toISOString();
  });
  eleventyConfig.addFilter("fullisodate", (dt) => {
    return dt.toISOString();
  });
  eleventyConfig.addFilter("hasitems", (dict) => {
    return Object.keys(dict).length > 0;
  });
  eleventyConfig.addFilter("now", () => {
    return new Date();
  });
  eleventyConfig.addFilter("readableDate", (dt) => {
    // with time
    return dt.toLocaleString("default", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  });
  eleventyConfig.addFilter("colourCycle", (index) => {
    const colours = [
      "#f00",
      "#0f0",
      "#00f",
      "#ff0",
      "#f0f",
      "#0ff",
      "#800",
      "#080",
      "#008",
      "#880",
      "#808",
      "#088",
      "#f80",
      "#f08",
      "#0f8",
      "#08f",
      "#8f0",
      "#80f",
      "#f88",
      "#8f8",
      "#88f",
      "#ff8",
      "#f8f",
      "#8ff",
    ];
    return colours[index % colours.length];
  });

  return {
    dir: {
      input: ".",
      data: "_data",
      output: "_site",
      templateFormats: ["hbs"],
    },
  };
};
