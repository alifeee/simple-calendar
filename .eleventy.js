const yaml = require("js-yaml");
const fs = require("fs");

module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget("./_data/");

  eleventyConfig.addDataExtension("yaml", (contents) =>
    yaml.safeLoad(contents)
  );

  eleventyConfig.addGlobalData("calendar", () => {
    // open all yaml files in _data
    const files = fs.readdirSync("_data");
    const dates = {};

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
      if (file.endsWith(".yaml")) {
        // get filename without extension
        const name = file.replace(".yaml", "");
        const data = yaml.safeLoad(fs.readFileSync(`_data/${file}`, "utf8"));

        // for each date
        Object.keys(data).forEach((date) => {
          // for each item in date
          let firstdate = new Date(date);
          data[date].forEach((item, index) => {
            // add index days to firstdate
            let thisdate = firstdate;
            if (index > 0) {
              thisdate = new Date(
                firstdate.getFullYear(),
                firstdate.getMonth(),
                firstdate.getDate() + index
              );
            }
            add_to_dates(dates, thisdate, name, item);
          });
        });
      }
    });

    // dates is now something like {"Mon Jan 29 2024 00:00:00 GMT+0000 (Greenwich Mean Time)":{"alfie":"hello","neil":"terminate"},"Tue Jan 30 2024 00:00:00 GMT+0000 (Greenwich Mean Time)":{"alfie":"world","neil":"john"}}
    // turn it into 2D array representing a calendar, starting from the first date (as a Monday)
    // first, sort dates by date
    const sorted_dates = Object.keys(dates).sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    // then, get the first date
    const first_date = new Date(sorted_dates[0]);
    // get first Monday before first date or first date if it is a Monday
    const first_monday = new Date(
      first_date.getFullYear(),
      first_date.getMonth(),
      first_date.getDate() - first_date.getDay() + 1
    );
    // get last date
    const last_date = new Date(sorted_dates[sorted_dates.length - 1]);
    // get last Sunday after last date or last date if it is a Sunday
    const last_sunday = new Date(
      last_date.getFullYear(),
      last_date.getMonth(),
      last_date.getDate() + (7 - last_date.getDay())
    );
    calendar = [];
    // for each week
    for (
      let week = first_monday;
      week <= last_sunday;
      week.setDate(week.getDate() + 7)
    ) {
      // add week to calendar
      calendar.push([]);
      // for each day of week
      for (let day = 0; day < 7; day++) {
        // get date object or null if it is not in dates
        const date = new Date(week);
        date.setDate(week.getDate() + day);
        const date_string = date.toString();
        const text_data = dates[date_string] || {};
        // add info to calendar day
        calendar[calendar.length - 1].push({
          date: date,
          text_data: text_data,
        });
      }
    }

    return calendar;
  });

  eleventyConfig.addFilter("json", (data) => {
    return JSON.stringify(data);
  });
  eleventyConfig.addFilter("date", (dt) => {
    const date = dt.getDate();
    const month = dt.toLocaleString("default", { month: "long" });
    if (date === 1) {
      return `${date} ${month}`;
    } else {
      return date;
    }
  });
  eleventyConfig.addFilter("isodate", (dt) => {
    return dt.toISOString().split("T")[0];
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

  return {
    dir: {
      input: "index.hbs",
      data: "_data",
      output: ".",
      templateFormats: ["hbs"],
    },
  };
};
