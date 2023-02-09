// Board globals
const BOARD_ID_2023 = 792637399;
const BOARD_ID_2022 = 3906645333;

const getMondayRequestResults = async (year) => {
  const BOARD_ID = eval(`BOARD_ID_${year}`);

  const graphql = JSON.stringify({
    query: `{ 
      boards(ids: ${BOARD_ID}) {
        id
        name
        items(newest_first: true) {
          name
          created_at
          group {
            title
          }
          column_values(ids: ["status_1" , "status_18"]) {
            text
          }
        }
      }
    }`,
    variables: {},
  });

  return await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: new Headers({
      Authorization: "Bearer " + window["API_KEY"],
      "Content-Type": "application/json",
    }),
    body: graphql,
    redirect: "follow",
  })
    .then((response) => response.text())
    .catch((error) => {
      document.getElementById("result").innerText = error;
      console.log("error", error);
    });
};

// Create an IIFE to do the above code, return a result
//   and then update the content of the HTML element with the ID of "result"
//   with the result of the IIFE
main = async (year = 2023) => {
  document.getElementById("data").innerHTML = `<img src="spinner.svg" />`;

  // Remove the active class from all of them
  let buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.classList.remove("active");
  });

  // Add a class to the button that was clicked
  document.getElementById(`btn-${year}`).classList.add("active");

  let res = await getMondayRequestResults(year);

  let { items } = JSON.parse(res).data.boards[0];

  // Append an item to the DOM with the total number of items
  document.getElementById(
    "data"
  ).innerHTML = `<h3>Total Board Items: <span style="color: white">${items.length}</span> <br /></h3>`;

  // let items_per_month = Array(12).fill();
  let items_per_month = Array.from(Array(12), () => {
    return {
      items: [],
      platforms: [],
    };
  });

  items.forEach((item) => {
    let createdMonth = new Date(item.created_at).getMonth();
    let month = new Date().getMonth();

    let createdMonthNumber = Math.abs(createdMonth - month);

    items_per_month[createdMonthNumber]["items"].push(item);

    // Get the current items platform
    let platform = item.column_values[1].text;
    items_per_month[createdMonthNumber]["platforms"].push(platform);
  });

  for (let i = 0; i < items_per_month.length; i++) {
    if (!items_per_month[i]["items"][0]) return;

    // Get the month and year from an item, and convert to a string value, e.g. 'January 2021'
    let monthAndYearHumanReadable =
      items_per_month[i]["items"][0]["created_at"];

    // Now convert date to a string that just says the month
    monthAndYearHumanReadable = new Date(monthAndYearHumanReadable)
      .toDateString()
      .split(" ")
      .slice(1, 4);

    monthAndYearHumanReadable.splice(1, 1);
    monthAndYearHumanReadable = monthAndYearHumanReadable.join(" ");

    // Create an array of all the platforms, and then count the number of times each platform appears
    let platforms = items_per_month[i]["platforms"];
    let platformsCount = {};

    platforms.forEach((platform) => {
      platform === "" ? (platform = "Unspecified") : platform;

      if (platformsCount[platform]) {
        platformsCount[platform]++;
      } else {
        platformsCount[platform] = 1;
      }
    });

    // Now sort the platforms by the number of items in each platform
    platformsCount = Object.fromEntries(
      Object.entries(platformsCount).sort(([, a], [, b]) => b - a)
    );

    // Now do the same thing for the priorities
    let priorities = items_per_month[i]["items"].map((item) => {
      return item.column_values[0].text;
    });

    let prioritiesCount = {};

    priorities.forEach((priority) => {
      priority === null ? (priority = "Unspecified") : priority;
      if (prioritiesCount[priority]) {
        prioritiesCount[priority]++;
      } else {
        prioritiesCount[priority] = 1;
      }
    });

    // Now sort the priorities by the number of items in each priority
    prioritiesCount = Object.fromEntries(
      Object.entries(prioritiesCount).sort(([, a], [, b]) => b - a)
    );

    // Check if we're dealing with the current year
    let currentYear = year === new Date().getFullYear();

    // Append an item to the DOM with the total number of items this month
    document.getElementById("data").innerHTML += `
    <fieldset style="border 1px; border-radius: 5px; margin: 1rem;">
      <legend><h2>${
        currentYear ? "Month: " + monthAndYearHumanReadable : "Year: " + year
      } </h2></legend>
      <b>Total Items Logged</b>: ${
        items_per_month[i]["items"].length
      } <br /><br />
      
      <table>
        <tr>
          <th>Priority</th>
          <th>Count</th>
        </tr>
        ${Object.keys(prioritiesCount)
          .map((priority) => {
            return `<tr>
              <td>${priority}</td> <td> ${prioritiesCount[priority]} </td>
              </tr>`;
          })
          .join("")}
      </table>


    <br /><br />
    <table>
        <tr>
          <th>Platform</th>
          <th>Count</th>
        </tr>
        ${Object.keys(platformsCount)
          .map((platform) => {
            return `<tr>
              <td>${platform}</td> <td> ${platformsCount[platform]} </td>
              </tr>`;
          })
          .join("")}
      </table>

      <br /><br />

    </fieldset>
    `;
  }

  items.forEach((item) => {
    document.getElementById("data").innerHTML += `
    <fieldset style="border 1px; border-radius: 5px">
    <legend>${item.name}</legend>
      <b>Group</b>: ${item.group.title}<br />
      <b>Priority</b>: ${item.column_values[0].text}<br />
      <b>Platform Affected</b>: ${item.column_values[1].text}<br />
      <b>Created</b>: ${item.created_at}
    </fieldset>
    <br />
    `;
  });
};

main();
