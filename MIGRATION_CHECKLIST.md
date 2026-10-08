# React migration parity checklist

This checklist must be complete before the React application replaces the current production site.

## Application shell

- [x] Light theme
- [x] Dark theme
- [x] Stored theme preference
- [x] Desktop navigation
- [x] Mobile navigation behavior
- [x] Logo → Home
- [x] Browser back/forward
- [ ] Responsive-layout parity verified across target devices
- [x] GitHub Pages base path configured

## Power / Current

- [x] 1-phase
- [x] Balanced 3-phase
- [x] Voltage
- [x] cos phi
- [x] W
- [x] kW
- [x] W ↔ kW value-preserving conversion
- [x] Validation
- [x] Calculation explanation
- [x] Exact existing numerical behavior

## Voltage Drop

- [ ] Current mode
- [ ] Power mode
- [ ] 1-phase
- [ ] Balanced 3-phase
- [ ] Cu
- [ ] Al
- [ ] Cable sections
- [ ] cos phi
- [ ] W/kW conversion
- [ ] Calculated current
- [ ] Voltage drop V
- [ ] Voltage drop %
- [ ] Status indicators
- [ ] Five-section comparison
- [ ] Comparison-row section selection
- [ ] Assumptions/formula explanation
- [ ] Exact existing numerical behavior

## Pickers

- [ ] Enhanced desktop/fine-pointer picker
- [ ] Native mobile/touch picker
- [ ] Fine/coarse pointer detection
- [ ] Keyboard interaction and Escape
- [ ] Outside click and focus return
- [ ] Native/enhanced synchronization
- [ ] ARIA state
- [ ] Light/dark theme

## Quality and cutover

- [x] Existing Vitest suites pass
- [x] Production build succeeds
- [ ] Narrow desktop verified
- [ ] Mobile verified
- [ ] Desktop verified
- [ ] GitHub Pages deployment workflow enabled at final cutover
- [ ] Production deployment verified at `/ElectroCalc/`
