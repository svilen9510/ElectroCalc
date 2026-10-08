# ElectroCalc

ElectroCalc е леко responsive уеб приложение за бързи електротехнически изчисления.

Проектът използва ясна модулна структура и се разработва чрез Git/GitHub с целеви промени
по отделните калкулатори, UI модули и източници на референтни данни.

## Текуща версия

**v0.3.0 — React/Vite Migration**

Текущата версия включва:

- responsive интерфейс за mobile и desktop;
- светла и тъмна тема;
- mobile/browser navigation и подготвена PWA standalone логика;
- калкулатор „Мощност → ток“;
- калкулатор за пад на напрежение с вход по ток или по активна мощност;
- еднофазни и балансирани трифазни AC системи;
- мощност във W или kW и поддръжка на cos φ;
- проводници от Мед (Cu) и Алуминий (Al);
- стандартни кабелни сечения от общия master източник `data/cable-sizes.js`;
- резултати за изчислен ток, пад на напрежение във V и пад в %;
- сравнение на пет стандартни сечения около избраното сечение;
- native `<select>` контроли на mobile/touch устройства;
- тематично съгласувани enhanced pickers на desktop устройства с fine pointer;
- React интерфейс с отделени UI компоненти, hooks и calculator views;
- framework-independent логика за изчисления, единици, валидация и референтни данни;
- Vite production build и GitHub Pages deployment чрез GitHub Actions.

## Модел за пад на напрежение

Voltage Drop калкулаторът използва resistance-only AC модел. При вход по мощност токът се
изчислява от активната мощност, напрежението, броя фази и cos φ. При трифазна система се приема
балансиран товар, а въведеното напрежение е линейното (междуфазното) напрежение.

Текущи допускания и ограничения:

- дължината е еднопосочната физическа дължина на трасето;
- при еднофазна система факторът 2 отчита отиващия и връщащия проводник;
- моделът включва само активното съпротивление на проводника;
- реактивното съпротивление не е включено;
- специфичното съпротивление на Мед и Алуминий е реферирано към 20°C;
- не се прилага температурна компенсация за работната температура на проводника;
- при трифазна система се приема балансиран товар;
- индикаторите „До 3%“, „Над 3%“ и „Над 5%“ са само ориентири и не представляват
  резултат от проверка за съответствие със стандарт.

## Planned / not yet implemented

- реактивно съпротивление;
- работна температура на проводника;
- допустим ток (ampacity);
- начин на полагане;
- корекции за групиране и околна температура;
- избор на защитен апарат;
- изчисления на късо съединение;
- проверки за съответствие със стандарти.

## Технологии

- React
- Vite
- JavaScript / JSX
- ES modules
- HTML
- CSS
- Vitest
- GitHub Actions

React управлява интерактивния UI и state слоя. Електрическите изчисления, конвертирането на
единици, валидацията и референтните данни остават framework-independent модули. Production
приложението се изгражда с Vite и се публикува в GitHub Pages чрез GitHub Actions.
ElectroCalc няма backend и остава статично frontend приложение.

## Структура

```text
ElectroCalc/
├── .github/workflows/   # CI проверки и GitHub Pages deployment
├── assets/
├── css/                 # теми, компоненти и responsive стилове
├── data/                # кабелни сечения, материали и референтни данни
├── js/
│   ├── calculators/     # framework-independent calculator/domain логика
│   └── utils/           # общи electrical, units и validation helpers
├── src/
│   ├── calculators/     # React calculator views
│   ├── components/      # споделени React UI компоненти
│   ├── hooks/           # navigation и theme hooks
│   ├── App.jsx          # application shell
│   └── main.jsx         # React entry point
├── tests/               # Vitest domain и React UI regression тестове
├── index.html
├── package.json
└── vite.config.js
```

## Локална разработка

Инсталирай зависимостите и стартирай Vite development server:

```sh
npm install
npm run dev
```

Vite показва локалния development URL в терминала. За тест от друго устройство в същата
локална мрежа използвай:

```sh
npm run dev -- --host
```

## Production build и preview

```sh
npm run build
npm run preview
```

Production файловете се генерират в `dist/`. Директорията е build output, игнорира се от Git
и не се commit-ва.

## Тестване

```sh
npm test
npm run test:watch
npm run test:coverage
```

Vitest защитава electrical/domain изчисленията и избрани regression поведения на React UI.

## GitHub Pages и CI

Production deployment процесът е:

```text
feature branch
→ tests/build
→ pull request
→ merge to main
→ GitHub Actions
→ Vite production build
→ GitHub Pages deployment
```

`tests.yml` валидира branch и pull request промените. След merge в `main`, отделният Pages
workflow изгражда приложението с Vite и публикува генерираното съдържание от `dist/`.
Repository source файловете не се публикуват директно. Сайтът остава статичен frontend.

## Работен Git процес

- създай фокусиран branch;
- реализирай ограничената промяна;
- изпълни тестовете и production build;
- push-ни branch-а и отвори pull request;
- изчакай CI проверките;
- merge-ни в `main`, след което GitHub Pages deployment се стартира автоматично.

## Важно за електротехническите изчисления

Резултатите са инженерни ориентири според изрично описания модел. Калкулаторът не проверява
допустими токове, температурни и групови коефициенти, начин на полагане, защитни апарати,
условия при късо съединение или всички изисквания на приложимите стандарти.

Не трябва да се приема, че даден резултат е нормативно съответстващ, освен ако приложението
изрично не извършва всички необходими проверки за конкретния случай.
