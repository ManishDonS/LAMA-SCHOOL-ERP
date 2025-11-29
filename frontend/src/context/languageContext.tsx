import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'ar'

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    students: 'Students',
    teachers: 'Teachers',
    guardians: 'Guardians',
    staff: 'Staff',
    attendance: 'Attendance',
    fees: 'Fees',
    library: 'Library',
    classes: 'Classes',
    schoolBuses: 'School Buses',
    exams: 'Exams',
    notifications: 'Notifications',
    reports: 'Reports',
    settings: 'Settings',

    // User Profile
    userProfile: 'User Profile',
    myProfile: 'My Profile',
    accountSettings: 'Account Settings',
    editProfile: 'Edit Profile',
    loginUser: 'Login User',

    // Profile Fields
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    joinDate: 'Join Date',
    bio: 'Bio',

    // Settings
    language: 'Language',
    selectLanguage: 'Select Language',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    systemMode: 'System Mode',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    enableNotifications: 'Enable Notifications',
    disableNotifications: 'Disable Notifications',

    // Password
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    changePassword: 'Change Password',
    passwordChanged: 'Password changed successfully!',
    passwordMismatch: 'Passwords do not match!',
    invalidPassword: 'Invalid current password!',

    // Buttons
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    logout: 'Logout',
    saveChanges: 'Save Changes',
    discardChanges: 'Discard Changes',

    // Messages
    profileUpdated: 'Profile updated successfully!',
    settingsSaved: 'Settings saved successfully!',
    confirmLogout: 'Are you sure you want to logout?',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',

    // Preferences
    preferences: 'Preferences',
    about: 'About',
    help: 'Help',
    feedback: 'Feedback',
    privacy: 'Privacy',
    terms: 'Terms & Conditions',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    students: 'छात्र',
    teachers: 'शिक्षक',
    guardians: 'अभिभावक',
    staff: 'कर्मचारी',
    attendance: 'उपस्थिति',
    fees: 'फीस',
    library: 'पुस्तकालय',
    classes: 'कक्षाएं',
    schoolBuses: 'स्कूल बसें',
    exams: 'परीक्षाएं',
    notifications: 'सूचनाएं',
    reports: 'रिपोर्ट',
    settings: 'सेटिंग्स',

    // User Profile
    userProfile: 'उपयोगकर्ता प्रोफाइल',
    myProfile: 'मेरी प्रोफाइल',
    accountSettings: 'खाता सेटिंग्स',
    editProfile: 'प्रोफाइल संपादित करें',
    loginUser: 'लॉगिन उपयोगकर्ता',

    // Profile Fields
    firstName: 'पहला नाम',
    lastName: 'अंतिम नाम',
    email: 'ईमेल',
    phone: 'फोन',
    role: 'भूमिका',
    joinDate: 'शामिल होने की तारीख',
    bio: 'परिचय',

    // Settings
    selectLanguage: 'भाषा चुनें',
    theme: 'विषय',
    lightMode: 'हल्का मोड',
    darkMode: 'अंधेरा मोड',
    systemMode: 'सिस्टम मोड',
    emailNotifications: 'ईमेल सूचनाएं',
    pushNotifications: 'पुश सूचनाएं',
    enableNotifications: 'सूचनाएं सक्षम करें',
    disableNotifications: 'सूचनाएं अक्षम करें',

    // Password
    currentPassword: 'वर्तमान पासवर्ड',
    newPassword: 'नया पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    changePassword: 'पासवर्ड बदलें',
    passwordChanged: 'पासवर्ड सफलतापूर्वक बदल गया!',
    passwordMismatch: 'पासवर्ड मेल नहीं खाते!',
    invalidPassword: 'अमान्य वर्तमान पासवर्ड!',

    // Buttons
    save: 'सहेजें',
    cancel: 'रद्द करें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    logout: 'लॉगआउट',
    saveChanges: 'परिवर्तन सहेजें',
    discardChanges: 'परिवर्तन छोड़ें',

    // Messages
    profileUpdated: 'प्रोफाइल सफलतापूर्वक अपडेट किया गया!',
    settingsSaved: 'सेटिंग्स सफलतापूर्वक सहेजी गई!',
    confirmLogout: 'क्या आप वाकई लॉगआउट करना चाहते हैं?',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',

    // Preferences
    preferences: 'प्राथमिकताएं',
    about: 'के बारे में',
    help: 'सहायता',
    feedback: 'प्रतिक्रिया',
    privacy: 'गोपनीयता',
    terms: 'नियम एवं शर्तें',
  },
  es: {
    // Navigation
    dashboard: 'Panel de Control',
    students: 'Estudiantes',
    teachers: 'Maestros',
    guardians: 'Tutores',
    staff: 'Personal',
    attendance: 'Asistencia',
    fees: 'Honorarios',
    library: 'Biblioteca',
    classes: 'Clases',
    schoolBuses: 'Autobuses Escolares',
    exams: 'Exámenes',
    notifications: 'Notificaciones',
    reports: 'Reportes',
    settings: 'Configuración',

    // User Profile
    userProfile: 'Perfil de Usuario',
    myProfile: 'Mi Perfil',
    accountSettings: 'Configuración de Cuenta',
    editProfile: 'Editar Perfil',
    loginUser: 'Usuario de Inicio de Sesión',

    // Profile Fields
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    role: 'Rol',
    joinDate: 'Fecha de Unión',
    bio: 'Biografía',

    // Settings
    selectLanguage: 'Seleccionar Idioma',
    theme: 'Tema',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    systemMode: 'Modo del Sistema',
    emailNotifications: 'Notificaciones por Correo',
    pushNotifications: 'Notificaciones Push',
    enableNotifications: 'Habilitar Notificaciones',
    disableNotifications: 'Desactivar Notificaciones',

    // Password
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    changePassword: 'Cambiar Contraseña',
    passwordChanged: '¡Contraseña cambiada exitosamente!',
    passwordMismatch: '¡Las contraseñas no coinciden!',
    invalidPassword: '¡Contraseña actual inválida!',

    // Buttons
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    logout: 'Cerrar Sesión',
    saveChanges: 'Guardar Cambios',
    discardChanges: 'Descartar Cambios',

    // Messages
    profileUpdated: '¡Perfil actualizado exitosamente!',
    settingsSaved: '¡Configuración guardada exitosamente!',
    confirmLogout: '¿Está seguro de que desea cerrar sesión?',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',

    // Preferences
    preferences: 'Preferencias',
    about: 'Acerca de',
    help: 'Ayuda',
    feedback: 'Retroalimentación',
    privacy: 'Privacidad',
    terms: 'Términos y Condiciones',
  },
  fr: {
    dashboard: 'Tableau de Bord',
    students: 'Étudiants',
    teachers: 'Enseignants',
    guardians: 'Tuteurs',
    staff: 'Personnel',
    attendance: 'Présence',
    fees: 'Frais',
    library: 'Bibliothèque',
    classes: 'Classes',
    schoolBuses: 'Autobus Scolaires',
    exams: 'Examens',
    notifications: 'Notifications',
    reports: 'Rapports',
    settings: 'Paramètres',
    userProfile: 'Profil Utilisateur',
    myProfile: 'Mon Profil',
    accountSettings: 'Paramètres du Compte',
    language: 'Langue',
    theme: 'Thème',
    changePassword: 'Changer le Mot de Passe',
    editProfile: 'Modifier le Profil',
    logout: 'Déconnexion',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'E-mail',
    phone: 'Téléphone',
    role: 'Rôle',
    joinDate: 'Date d\'Adhésion',
    bio: 'Biographie',
    save: 'Enregistrer',
    cancel: 'Annuler',
    profileUpdated: 'Profil mis à jour avec succès!',
    settingsSaved: 'Paramètres enregistrés avec succès!',
    loading: 'Chargement...',
  },
  de: {
    dashboard: 'Armaturenbrett',
    students: 'Schüler',
    teachers: 'Lehrer',
    guardians: 'Betreuer',
    staff: 'Personal',
    attendance: 'Anwesenheit',
    fees: 'Gebühren',
    library: 'Bibliothek',
    classes: 'Klassen',
    schoolBuses: 'Schulbusse',
    exams: 'Prüfungen',
    notifications: 'Benachrichtigungen',
    reports: 'Berichte',
    settings: 'Einstellungen',
    userProfile: 'Benutzerprofil',
    myProfile: 'Mein Profil',
    accountSettings: 'Kontoeinstellungen',
    language: 'Sprache',
    logout: 'Abmelden',
    save: 'Speichern',
    cancel: 'Abbrechen',
    profileUpdated: 'Profil erfolgreich aktualisiert!',
    settingsSaved: 'Einstellungen erfolgreich gespeichert!',
    loading: 'Wird geladen...',
  },
  pt: {
    dashboard: 'Painel de Controle',
    students: 'Alunos',
    teachers: 'Professores',
    guardians: 'Responsáveis',
    staff: 'Equipe',
    attendance: 'Presença',
    fees: 'Taxas',
    library: 'Biblioteca',
    classes: 'Aulas',
    schoolBuses: 'Ônibus Escolares',
    exams: 'Exames',
    notifications: 'Notificações',
    reports: 'Relatórios',
    settings: 'Configurações',
    userProfile: 'Perfil do Usuário',
    myProfile: 'Meu Perfil',
    accountSettings: 'Configurações de Conta',
    language: 'Idioma',
    logout: 'Sair',
    save: 'Salvar',
    cancel: 'Cancelar',
    profileUpdated: 'Perfil atualizado com sucesso!',
    settingsSaved: 'Configurações salvas com sucesso!',
    loading: 'Carregando...',
  },
  ja: {
    dashboard: 'ダッシュボード',
    students: '学生',
    teachers: '教師',
    guardians: '保護者',
    staff: 'スタッフ',
    attendance: '出席',
    fees: '手数料',
    library: '図書館',
    classes: 'クラス',
    schoolBuses: 'スクールバス',
    exams: '試験',
    notifications: '通知',
    reports: 'レポート',
    settings: '設定',
    userProfile: 'ユーザープロフィール',
    myProfile: 'マイプロフィール',
    accountSettings: 'アカウント設定',
    language: '言語',
    logout: 'ログアウト',
    save: '保存',
    cancel: 'キャンセル',
    profileUpdated: 'プロフィールが正常に更新されました!',
    settingsSaved: '設定が正常に保存されました!',
    loading: '読み込み中...',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    students: 'الطلاب',
    teachers: 'المعلمين',
    guardians: 'الأولياء',
    staff: 'الموظفين',
    attendance: 'الحضور',
    fees: 'الرسوم',
    library: 'المكتبة',
    classes: 'الفئات',
    schoolBuses: 'حافلات المدرسة',
    exams: 'الامتحانات',
    notifications: 'الإخطارات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    userProfile: 'ملف المستخدم',
    myProfile: 'ملفي الشخصي',
    accountSettings: 'إعدادات الحساب',
    language: 'اللغة',
    logout: 'تسجيل الخروج',
    save: 'حفظ',
    cancel: 'إلغاء',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح!',
    settingsSaved: 'تم حفظ الإعدادات بنجاح!',
    loading: 'جاري التحميل...',
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved && (translations as any)[saved]) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return (translations as any)[language]?.[key] || (translations.en as any)[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
