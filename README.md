# ElectroCalc

ElectroCalc е responsive уеб приложение за бързи електротехнически изчисления.

Това repository започва от стабилната UI основа на проекта. Оттук нататък
разработката се води чрез Git/GitHub и целеви промени по отделните модули.

## Текуща версия

**v0.1.0 — GitHub baseline**

Включва:

- responsive интерфейс;
- светла и тъмна тема;
- mobile/browser navigation;
- подготвена PWA standalone логика;
- калкулатор „Мощност → ток“;
- базов калкулатор за пад на напрежение;
- сравнение на стандартни сечения;
- отделена calculator / UI / helper логика.

## Технологии

- HTML
- CSS
- Vanilla JavaScript
- ES modules

Няма framework и няма backend. Проектът е подходящ за GitHub Pages.

## Структура

```text
ElectroCalc/
├── index.html
├── AGENTS.md
├── README.md
├── .gitignore
├── assets/
├── css/
├── data/
└── js/
    ├── calculators/
    ├── ui/
    └── utils/
```

## Локално стартиране

Поради ES modules използвай локален web server.

### VS Code + Live Server

Отвори папката във VS Code и стартирай `index.html` с Live Server.

### Python

```bash
python -m http.server 8000
```

После отвори:

```text
http://localhost:8000
```

## Начален Git workflow

```bash
git init
git add .
git commit -m "Initial ElectroCalc baseline"
```

След това repository-то може да се свърже с GitHub.

## Важно за електротехническите изчисления

Текущият модул за пад на напрежение използва опростен модел и служи като
работна основа. Нормативните проверки, допустимите токове, температурните
коефициенти, начините на полагане, защитите и други инженерни правила ще се
добавят поетапно.

Не трябва да се приема, че даден резултат е нормативно съответстващ, освен
ако приложението изрично не извършва необходимата проверка.
