# Contributing to FebriStore E-Commerce App

Terima kasih atas minat Anda untuk berkontribusi pada FebriStore! Dokumen ini berisi panduan untuk berkontribusi pada proyek ini.

## ?? Cara Berkontribusi

### 1. Fork Repository
- Fork repository ini ke akun GitHub Anda
- Clone fork Anda ke local machine

`ash
git clone https://github.com/YOUR_USERNAME/E-SkuulTime.git
cd 'EXPO Ecommerce'
`

### 2. Setup Development Environment
`ash
# Install dependencies
npm install

# Jalankan aplikasi
npx expo start
`

### 3. Buat Branch Baru
`ash
git checkout -b feature/nama-fitur-anda
`

### 4. Coding Standards

#### JavaScript/React Native
- Gunakan ES6+ syntax
- Ikuti konvensi penamaan camelCase
- Gunakan functional components dengan hooks
- Tulis komentar untuk logika kompleks

#### File Structure
`
components/
+-- common/          # Komponen umum
+-- forms/           # Form components
+-- ui/              # UI components

screens/
+-- admin/           # Admin screens
+-- buyer/           # Buyer screens
+-- seller/          # Seller screens
`

#### Naming Conventions
- Components: PascalCase (e.g., ProductCard.js)
- Files: camelCase (e.g., userService.js)
- Constants: UPPER_SNAKE_CASE (e.g., API_ENDPOINTS)
- Variables: camelCase (e.g., userName)

### 5. Commit Guidelines

Gunakan format commit yang jelas:

`
type(scope): description

feat(auth): add login with Google
fix(cart): resolve quantity update bug
docs(readme): update installation guide
style(ui): improve button styling
refactor(api): optimize user service
test(auth): add login component tests
`

Types:
- eat: Fitur baru
- ix: Bug fix
- docs: Dokumentasi
- style: Styling/formatting
- efactor: Refactoring code
- 	est: Testing
- chore: Maintenance

### 6. Testing

`ash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
`

Pastikan:
- Semua test existing masih pass
- Tambahkan test untuk fitur baru
- Coverage minimal 80%

### 7. Pull Request

1. Push branch Anda ke fork
2. Buat Pull Request ke repository utama
3. Isi template PR dengan lengkap
4. Tunggu review dari maintainer

#### PR Template
`markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new features
- [ ] Manual testing completed

## Screenshots
Add screenshots if applicable

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
`

## ?? Bug Reports

Gunakan template issue untuk bug report:

`markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen

**Screenshots**
Add screenshots if applicable

**Environment**
- Device: [e.g. iPhone 12]
- OS: [e.g. iOS 15.0]
- App Version: [e.g. 1.0.0]
`

## ?? Feature Requests

Template untuk feature request:

`markdown
**Feature Description**
Clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives**
Alternative solutions considered

**Additional Context**
Any other context or screenshots
`

## ?? Development Workflow

1. **Planning**: Diskusi di GitHub Issues
2. **Development**: Buat branch, coding, testing
3. **Review**: Submit PR, code review
4. **Testing**: QA testing
5. **Deployment**: Merge ke main branch

## ?? Development Tools

### Recommended Extensions (VS Code)
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

### Debugging
- React Native Debugger
- Flipper
- Chrome DevTools

## ?? Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)

## ?? Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Focus on constructive feedback
- Follow project guidelines

## ?? Getting Help

- GitHub Issues: Technical questions
- Discord: Real-time chat
- Email: support@febristore.com

---

Happy coding! ??
