const readline = require('readline');
const Database = require('./db')
const { createCompletion } = require('./openai');

require('dotenv').config();

const db = new Database();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const generateChapters = async () => {
  console.log('Enter the subject of the story:');
  const subject = await new Promise((resolve) => {
    rl.question('> ', (answer) => {
      resolve(answer);
    });
  });
  await generateChaptersList(subject);
};

const generateChaptersList = async (subject) => {
  console.log("Generating chapters...");
  const query = `Generate list of chapters for a story. Subject of the story is ${subject}. ` +
    "Return the list as JSON array. Every item in the list should be chapter's name and short description. " +
    "Make it interesting and captivating. Try to make it a cautionary tale. " +
    "Item structure is: " +
    '{"name": "example name", "description": "example description."} ' +
    "Return JSON and nothing more.";

  try {
    const completion = await createCompletion([
      {
        role: "user",
        content: query
      }
    ]);
    const parsedTasks = JSON.parse(completion);
    const tasksDb = parsedTasks.map((x) => {
      return {
        info: `"${x.name}" ${x.description}`,
        status: "todo",
        answer: ""
      };
    });

    await db.Task.bulkCreate(tasksDb);
    console.log("Chapters saved!");
  } catch (error) {
    console.error('Error generating chapters:', error);
  } finally {
    rl.question("..", () => {
      rl.close();
    });
  }
};

const generateParagraphs = async () => {
  try {
    const tasks = await db.Task.findAll({
      where: { status: "todo" }
    });

    if (tasks.length === 0) {
      console.log("No tasks found");
      rl.close();
      return;
    }

    for (let i = 0; i < tasks.length; i++) {
      const row = tasks[i];
      console.log(`Running... (${i + 1}/${tasks.length})`);

      let story = "";
      const finishedParagraphs = await db.Task.findAll({
        where: { status: "done" }
      });

      for (const paragraph of finishedParagraphs) {
        story += paragraph.answer;
      }

      const query = story + `Write a paragraph. Here is title and description of the paragraph: ${row.info}`;

      try {
        const completion = await createCompletion([
          {
            role: "user",
            content: query
          }
        ]);

        row.status = "done";
        row.answer = completion;
        await row.save();
      } catch (error) {
        console.error('Error generating paragraph:', error);
        rl.close();
        return;
      }
    }

    console.log("Done!");
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    rl.close();
  }
};

const showSavedChapters = async () => {
  try {
    const tasks = await db.Task.findAll();

    if (tasks.length === 0) {
      console.log("No tasks found");
    } else {
      tasks.forEach((row) => {
        console.log("ID:", row.id, "\nStatus:", row.status, "\nInfo:", row.info, "\nHas paragraph:",
          row.answer !== "" ? "Yes" : "No", "\n");
      });
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    rl.question("..", () => {
      rl.close();
    });
  }
};

const clearSavedChapters = async () => {
  try {
    await db.Task.destroy({ truncate: true });
    console.log("Tasks cleared!");
  } catch (error) {
    console.error('Error clearing tasks:', error);
  } finally {
    rl.question("..", () => {
      rl.close();
    });
  }
};

const exportToTxt = async () => {
  try {
    const readyChapters = await db.Task.findAll({
      where: { status: "done" }
    });
    const unfinishedChapters = await db.Task.findAll({
      where: { status: "todo" }
    });

    if (unfinishedChapters.length !== 0) {
      console.log("There are unfinished chapters!");
      rl.question("..", () => {
        rl.close();
      });
      return;
    }

    const text = readyChapters.reduce((accum, row) => accum + row.answer + "\n\n", "");
    const fs = require('fs');
    fs.writeFile("output.txt", text, (error) => {
      if (error) {
        console.error('Error exporting to txt:', error);
      } else {
        console.log("Output saved to output.txt");
      }
      rl.question("..", () => {
        rl.close();
      });
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    rl.close();
  }
};

const printMenu = () => {
  console.log("\nPlease choose an option:");
  console.log("1. Generate list of chapters for a story");
  console.log("2. Generate paragraphs for each chapter");
  console.log("3. Show saved chapters");
  console.log("4. Clear saved chapters");
  console.log("5. Export to txt");
  console.log("0. Quit");
};

const handleUserChoice = async (userChoice) => {
  switch (userChoice) {
    case "1":
      await generateChapters();
      break;
    case "2":
      await generateParagraphs();
      break;
    case "3":
      await showSavedChapters();
      break;
    case "4":
      await clearSavedChapters();
      break;
    case "5":
      await exportToTxt();
      break;
    case "0":
      console.log("Goodbye!");
      db.close();
      rl.close();
      return;
    default:
      console.log("Invalid choice!");
      break;
  }
  printMenu();
  rl.question('> ', handleUserChoice);
};

const main = async () => {
  db.initialize();

  printMenu();

  rl.question('> ', handleUserChoice);
};

main();
