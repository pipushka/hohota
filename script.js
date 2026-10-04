const type ="use strict";

// =========================================
// СЧИТАЛКА ОТЧЁТОВ
// =========================================

// ---------- Элементы ----------

const reportsArea = document.getElementById("reports");
const calculateBtn = document.getElementById("calculateBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

const resultsBody = document.getElementById("resultsBody");
const errorsBox = document.getElementById("errors");
const totalPlayers = document.getElementById("totalPlayers");

// ---------- Данные ----------

let players = {};
let errors = [];

// =========================================
// Игрок
// =========================================

function createPlayer(id)
{
    if (!players[id])
    {
        players[id] =
{
    id: id,
    hunt: 0,
    mouse: 0,
    lead: 0,
    dates: {}
};
    }

    return players[id];
}

function addHunt(id, value, date, reportNumber)
{
    const player = createPlayer(id);

    date = date.trim();


    if(!player.dates[date])
    {
        player.dates[date] =
        {
            hunt: 0,
            mouse: 0,
            huntReports: [],
            mouseReports: []
        };
    }


    player.dates[date].hunt += value;

    player.dates[date].huntReports.push(reportNumber);

    player.hunt += value;
}

function addMouse(id, value, date, reportNumber)
{
    const player = createPlayer(id);


    if(!player.dates[date])
    {
        player.dates[date] =
        {
            hunt: 0,
            mouse: 0,
             huntReports: [],
    mouseReports: []
        };
    }


    let available =
        5 - player.dates[date].mouse;


    if(available <= 0)
        return;


    let add =
        Math.min(value, available);


    player.dates[date].mouse += add;

    player.mouse += add;
}

function addLead(id)
{
    createPlayer(id).lead++;
}

// =========================================
// Очистка
// =========================================

function clearAll()
{
    players = {};
    errors = [];

    drawErrors();
    drawResults();
}

// =========================================
// Деление текста на комментарии
// =========================================

function splitReports(text)
{
    const reports = [];

    const regex =
        /(?:^|\n)\s*\*{0,2}#(\d+)\*{0,2}[\s\S]*?(?=\n\s*\*{0,2}#\d+\*{0,2}|$)/g;


    let match;


    while((match = regex.exec(text)) !== null)
    {
        reports.push({
            number: Number(match[1]),
            text: match[0]
        });
    }


    return reports;
}

// =========================================
// Получение игроков из строки
// =========================================

function parsePeople(text)
{
    const list = [];

    const used = new Set();

    const regex =
        /\[(\d+)\]\s*(?:\(([\d.,]+)\))?/g;

    let match;

    while ((match = regex.exec(text)) !== null)
    {
        const id = match[1];

        if (used.has(id))
            continue;

        used.add(id);

        list.push({
            id: id,
            points:
                match[2] == null
                ? null
                : Number(match[2].replace(",", "."))
        });
    }

    return list;
}

// =========================================
// Получение ID без баллов
// =========================================

function parseIds(text)
{
    const ids = [];

    const used = new Set();

    const regex = /\[(\d+)\]/g;

    let match;

    while ((match = regex.exec(text)) !== null)
    {
        if (used.has(match[1]))
            continue;

        used.add(match[1]);

        ids.push(match[1]);
    }

    return ids;
}

// =========================================
// Главная функция
// =========================================

function calculate()
{
    players = {};
    errors = [];

    const text = reportsArea.value.trim();

    if (!text)
    {
        errors.push("Нет вставленных отчётов.");

        drawErrors();
        drawResults();

        return;
    }

    const reports = splitReports(text);

    for (const report of reports)
{
    parseReport(report.number, report.text);
}


checkDailyLimits();


drawErrors();
drawResults();
}

//ловим даты странные
function checkFutureDate(reportNumber, text, reportDate)
{
    const headerMatch = text.match(
        /#\d+\s+(Сегодня|Вчера|\d{1,2}\s+[а-яё]+\s+в)/i
    );


    if(!headerMatch)
        return;


    let commentDate;


    const word = headerMatch[1].toLowerCase();


    const now = new Date();


    if(word === "сегодня")
    {
        commentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
    }
    else if(word === "вчера")
    {
        commentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1
        );
    }
    else
    {
        const months = {
            "января":0,
            "февраля":1,
            "марта":2,
            "апреля":3,
            "мая":4,
            "июня":5,
            "июля":6,
            "августа":7,
            "сентября":8,
            "октября":9,
            "ноября":10,
            "декабря":11
        };


        const dateMatch = text.match(
            /#\d+\s+(\d{1,2})\s+([а-яё]+)\s+в/i
        );


        if(!dateMatch)
            return;


        commentDate = new Date(
            now.getFullYear(),
            months[dateMatch[2].toLowerCase()],
            Number(dateMatch[1])
        );
    }


    const parts = reportDate.split(".");


    const report = new Date(
        Number(parts[2]),
        Number(parts[1])-1,
        Number(parts[0])
    );


    if(report > commentDate)
    {
        errors.push(
            `Привет из будущего. #${reportNumber} — дата отчёта ${reportDate} не может быть позже даты комментария.`
        );
    }
}

// =========================================
// Пока пусто
// =========================================

function parseReport(number, text)
{
    
// Игнорируем отчёты команд
if(/Название команды:/i.test(text))
{
    return;
}   
    //------------------------------------
    // Вид
    //------------------------------------
   const dateMatch =
    text.match(/Дата:\s*\*?(\d{2}\.\d{2}\.\d{2,4})/i);


if(!dateMatch)
{
    errors.push(`#${number} — не найдена дата.`);
    return;
}


let reportDate = dateMatch[1];


// Если год короткий, превращаем в полный
let parts = reportDate.split(".");

if(parts[2].length === 2)
{
    parts[2] = "20" + parts[2];
}

reportDate = parts.join(".");
    checkFutureDate(
    number,
    text,
    reportDate
);
    
    const typeMatch =
        text.match(/Вид:\s*([^;\n]+)/i);

    if(!typeMatch)
    {
        errors.push(`#${number} — отсутствует поле "Вид".`);
        return;
    }

    const type =
        typeMatch[1].trim().toLowerCase();

const hasLeader =
    /\*{0,2}Ведущий\*{0,2}\s*:/i.test(text);


// Проверяем вид только у обычных отчётов без ведущего
if(!hasLeader)
{
    const allowedTypes = [
        "свободная",
        "на мышей"
    ];


    if(!allowedTypes.includes(type))
    {
        errors.push(
            `#${number} — неизвестный вид охоты: "${typeMatch[1].trim()}". Допустимо: свободная или на мышей.`
        );

        return;
    }
}
    
    
// пока-пока север и ветер
text = text.replace(
    /\*{0,2}(Север|Ветер):\*{0,2}[\s\S]*?(?=\*{0,2}[А-ЯЁ]|$)/gi,
    ""
);

    checkBrokenPeople(number, text);
    //------------------------------------
    // История
    //------------------------------------

if(
    !/История/i.test(text) &&
    !/Ведущий:/i.test(text)
)
{
    errors.push(`#${number} — отсутствует история.`);
}
    //------------------------------------
    // Место охоты
    //------------------------------------

    if(
        type.includes("утрен") ||
        type.includes("вечер") ||
        type.includes("ноч") ||
        type.includes("днев")
    )
    {
        if(!/Место охоты:/i.test(text))
        {
            errors.push(`#${number} — отсутствует место охоты.`);
        }
    }

  //------------------------------------
// Мышиная охота
//------------------------------------

if(type.includes("мыш"))
{
    const participant =
        text.match(
            /\*{0,2}Участник:\*{0,2}[\s\S]*?\[(\d+)\]\s*\(([\d.,]+)\)/i
        );


    if(!participant)
    {
        errors.push(`#${number} — не найден участник.`);
        return;
    }


    const id = participant[1];

    const points =
        Number(
            participant[2].replace(",", ".")
        );


    addMouse(
        id,
        points,
        reportDate,
        number
    );


    return;
}

    //------------------------------------
    // Один участник
    //------------------------------------

    const single =
        text.match(/Участник:([\s\S]*?)(?=\n[A-ЯЁ]|$)/i);

    if(single)
    {
        const people =
            parsePeople(single[1]);

        if(people.length===0)
        {
            errors.push(`#${number} — неверный участник.`);
        }

        for(const person of people)
{
    if(person.points==null)
    {
        errors.push(`#${number} — нет баллов у ${person.id}.`);
        continue;
    }

    addHunt(
        person.id,
        person.points,
        reportDate,
        number
    );
}
    }

function checkBrokenPeople(number, text)
{
    const names =
        text.match(
            /(?:Участник|Участники):([\s\S]*?)(?=\n\*{0,2}[А-ЯЁ]|$)/i
        );


    if(!names)
        return;


    const block = names[1];


    if(block.trim() === "-")
        return;


    const hasName =
        /[А-ЯЁа-яё]/.test(block);


    const hasId =
        /\[\d+\]/.test(block);


    if(hasName && !hasId)
    {
        errors.push(
            `#${number} — указан участник без ID.`
        );
    }
}

    //------------------------------------
    // Несколько участников
    //------------------------------------

   const multi =
text.match(
    /\*{0,2}Участники:\*{0,2}\s*([\s\S]*?);?\s*(?=\*{0,2}Таскающие:|\*{0,2}Север:|\*{0,2}Ветер:|$)/i
);

if(multi)
{
    let participantText = multi[1]
        .replace(/;/g, "")
        .trim();


    // Участников нет — это нормально
    if(
        participantText === "-" ||
        participantText === ""
    )
    {
        // ничего не делаем
    }
    else
    {
        const people =
            parsePeople(participantText);
    

        for(const person of people)
        {
            if(person.points == null)
            {
                errors.push(
                    `#${number} — нет баллов у ${person.id}.`
                );
                continue;
            }


            addHunt(
                person.id,
                person.points,
                reportDate,
                number
            );
        }
    }
}

   //------------------------------------
// Ведущий
//------------------------------------

const leader =
    text.match(
        /Ведущий:\*{0,2}[\s\S]*?\[(\d+)\]\s*\(([\d.,]+)\)/i
    );
    
if (leader)
{
    const id = leader[1];

    const points =
        Number(
            leader[2].replace(",", ".")
        );


    addLead(id);


    // проверяем, есть ли он уже среди участников

    let alreadyParticipant = false;


    if(single)
    {
        alreadyParticipant =
            parsePeople(single[1])
            .some(p => p.id === id);
    }


    if(multi)
    {
        alreadyParticipant =
            alreadyParticipant ||
            parsePeople(multi[1])
            .some(p => p.id === id);
    }


    if(!alreadyParticipant)
{
    addHunt(
        id,
        points,
        reportDate,
        number
    );
}
}
else if (
    type.includes("утрен") ||
    type.includes("вечер") ||
    type.includes("ноч") ||
    type.includes("днев")
)
{
    errors.push(`#${number} — отсутствует ведущий.`);
}

    //------------------------------------
    // Таскающие
    //------------------------------------

   const carriers =
    text.match(/\*{0,2}Таскающие:\*{0,2}([\s\S]*?)(?=\n\*{0,2}[А-ЯЁ]|$)/i);

    if(carriers)
    {
        const ids =
            parseIds(carriers[1]);

        for(const id of ids)
        {
            addHunt(
    id,
    2.5,
    reportDate
);
        }
    }

    //------------------------------------
    // Проверка участников
    //------------------------------------

    if(
        !single &&
        !multi &&
        !type.includes("мыш")
    )
    {
        errors.push(`#${number} — отсутствуют участники.`);
    }
}

// =========================================
// Вывод ошибок
// =========================================

function checkDailyLimits()
{
    for(const player of Object.values(players))
    {
        for(const date in player.dates)
        {
            const data = player.dates[date];


            if(data.hunt > 5)
            {
                errors.push(
                    `Игрок ${player.id} уже получил максимум дичи за ${date}, комментарии того дня: ${data.huntReports.join(", ")}`
                );


                let excess = data.hunt - 5;

                player.hunt -= excess;

                data.hunt = 5;
            }


            if(data.mouse > 5)
            {
                errors.push(
                    `Игрок ${player.id} уже получил максимум мышей за ${date}, комментарии того дня: ${data.mouseReports.join(", ")}`
                );


                let excess = data.mouse - 5;

                player.mouse -= excess;

                data.mouse = 5;
            }
        }
    }
}


function drawErrors()
{
    errorsBox.innerHTML = "";

    if (errors.length === 0)
    {
        errorsBox.innerHTML =
            "<div class='success'>Ошибок не найдено.</div>";

        return;
    }

    for (const error of errors)
    {
        const div = document.createElement("div");

        div.className = "error";

        div.textContent = error;

        errorsBox.appendChild(div);
    }
}

// =========================================
// Вывод результатов
// =========================================

function drawResults()
{
    resultsBody.innerHTML = "";

    const list = Object.values(players);

    list.sort((a, b) => Number(a.id) - Number(b.id));

    totalPlayers.textContent =
        "Игроков: " + list.length;

    if (list.length === 0)
    {
        resultsBody.innerHTML = `
        <tr class="placeholderRow">
            <td colspan="4">
                Пока нет данных.
            </td>
        </tr>`;

        return;
    }

    for (const player of list)
    {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="idCell">${player.id}</td>
            <td class="scoreCell">${formatNumber(player.hunt)}</td>
            <td class="leadCell">${player.lead}</td>
            <td class="mouseCell">${formatNumber(player.mouse)}</td>
        `;

        resultsBody.appendChild(row);
    }
}

// =========================================
// Красивушный вывод чисел
// =========================================

function formatNumber(value)
{
    if (Number.isInteger(value))
        return value;

    return value.toFixed(1).replace(".", ",");
}

// =========================================
// Копирование результата
// =========================================

function copyResult()
{
    const list = Object.values(players);

    if (list.length === 0)
        return;

    list.sort((a, b) => Number(a.id) - Number(b.id));

    let result = "";

    for (const player of list)
    {
        result +=
`${player.id}\t${formatNumber(player.hunt)}\t${player.lead}\t${formatNumber(player.mouse)}\n`;
    }

    navigator.clipboard.writeText(result);

    copyBtn.textContent = "Скопировано!";

    setTimeout(() =>
    {
        copyBtn.textContent =
            "Копировать результат";
    }, 1500);
}

// =========================================
// Первоначальная отрисовка
// =========================================

drawErrors();
drawResults();

// =========================================
// Кнопки
// =========================================

calculateBtn.addEventListener("click", calculate);

clearBtn.addEventListener("click", () =>
{
    reportsArea.value = "";
    clearAll();
});

copyBtn.addEventListener("click", copyResult);
