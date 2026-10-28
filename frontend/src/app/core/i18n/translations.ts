export interface TranslationDictionary {
  [key: string]: string;
}

export const EN_TRANSLATIONS: TranslationDictionary = {
  // Brand & Nav
  'brand.name': 'Smash Club',
  'brand.tagline': 'Premium Badminton Management',
  'nav.dashboard': 'Dashboard',
  'nav.games': 'Games & Courts',
  'nav.players': 'Players',
  'nav.expenses': 'Expense Splitter',
  'nav.payments': 'Payments',
  'nav.settlements': 'Settlements',
  'nav.reports': 'Reports & Exports',
  'nav.settings': 'Settings',
  'nav.logout': 'Logout',
  'nav.login': 'Login',
  'nav.role.admin': 'Club Administrator',
  'nav.role.player': 'Club Member',

  // Actions & Buttons
  'action.addGame': 'New Game',
  'action.addPlayer': 'Add Player',
  'action.recordPayment': 'Record Payment',
  'action.settleNow': 'Settle Balance',
  'action.exportCsv': 'Export CSV',
  'action.save': 'Save Changes',
  'action.cancel': 'Cancel',
  'action.confirm': 'Confirm',
  'action.calculate': 'Calculate Split',
  'action.invite': 'Invite Member',
  'action.copyLink': 'Copy Invite Link',
  'action.deactivate': 'Deactivate',
  'action.activate': 'Activate',
  'action.viewDetails': 'View Details',
  'action.recordAttendance': 'Record Attendance',
  'action.verify': 'Verify & Approve',
  'action.reject': 'Reject',

  // Dashboard Stats
  'stat.activePlayers': 'Active Players',
  'stat.upcomingGames': 'Upcoming Games',
  'stat.monthlyExpenses': 'Monthly Expenses',
  'stat.paymentsCollected': 'Payments Collected',
  'stat.outstandingBalance': 'Outstanding Balance',
  'stat.totalGames': 'Total Games Played',
  'stat.myShare': 'My Total Share',
  'stat.myPaid': 'Total Amount Paid',
  'stat.myBalance': 'My Pending Balance',

  // Game Management
  'game.title': 'Session Title',
  'game.courtName': 'Court Name',
  'game.location': 'Venue Location',
  'game.date': 'Date',
  'game.time': 'Time',
  'game.courtCost': 'Court Booking Cost',
  'game.shuttleCost': 'Shuttlecock Expenses',
  'game.additionalCost': 'Additional Expenses',
  'game.totalCost': 'Total Cost',
  'game.organizer': 'Session Organizer',
  'game.participants': 'Participants',
  'game.attended': 'Attended',
  'game.absent': 'Absent',
  'game.notes': 'Session Notes',
  'game.splitType': 'Expense Split Model',
  'game.status': 'Status',
  'game.financialConfirmed': 'Financially Confirmed',

  // Expense Splitting
  'split.equal': 'Equal Split',
  'split.customFixed': 'Custom Fixed Amount',
  'split.customPercentage': 'Custom Percentage (%)',
  'split.perPerson': 'Per Player Share',
  'split.reconciledNotice': 'Exact penny reconciliation verified: sum matches total 100%.',
  'split.confirmNotice': 'Recalculating attendance modifies financial records. Please confirm.',
  'split.preview': 'Split Allocation Preview',

  // Payments & Statuses
  'status.paid': 'PAID',
  'status.pending': 'PENDING',
  'status.partiallyPaid': 'PARTIALLY PAID',
  'status.scheduled': 'SCHEDULED',
  'status.completed': 'COMPLETED',
  'status.cancelled': 'CANCELLED',
  'status.pendingVerification': 'PENDING VERIFICATION',
  'status.settled': 'SETTLED',

  // Settlement & Who Owes Whom
  'settlement.whoOwesWhom': 'Who Owes Whom (Debt Simplification)',
  'settlement.owes': 'owes',
  'settlement.receives': 'receives',
  'settlement.netBalance': 'Net Balance',
  'settlement.allSettled': 'All balances are settled! No outstanding dues.',
  'settlement.organizerReimbursement': 'Organizer Advances & Reimbursements',

  // Player Management
  'player.uniqueId': 'Player ID',
  'player.name': 'Full Name',
  'player.mobile': 'Mobile Number',
  'player.email': 'Email Address',
  'player.joinDate': 'Join Date',
  'player.status': 'Account Status',
  'player.active': 'Active',
  'player.inactive': 'Inactive',
  'player.financialSummary': 'Financial Summary',

  // Reports
  'report.monthlyTrends': 'Monthly Expense & Payment Trends',
  'report.categoryBreakdown': 'Expense Category Distribution',
  'report.playerStatements': 'Player Financial Statements',
  'report.searchPlaceholder': 'Search games by court, date or organizer...',

  // Messages & Alerts
  'msg.success': 'Operation completed successfully.',
  'msg.error': 'An error occurred. Please try again.',
  'msg.paymentRecorded': 'Payment of ₹{amount} recorded successfully.',
  'msg.copied': 'Invitation link copied to clipboard!'
};

export const TE_TRANSLATIONS: TranslationDictionary = {
  // Brand & Nav
  'brand.name': 'స్మాష్ క్లబ్',
  'brand.tagline': 'ప్రీమియం బ్యాడ్మింటన్ నిర్వహణ',
  'nav.dashboard': 'డాష్‌బోర్డ్',
  'nav.games': 'ఆటలు & కోర్టులు',
  'nav.players': 'క్రీడాకారులు',
  'nav.expenses': 'ఖర్చుల విభజన',
  'nav.payments': 'చెల్లింపులు',
  'nav.settlements': 'సెటిల్మెంట్లు',
  'nav.reports': 'నివేదికలు & ఎగుమతులు',
  'nav.settings': 'సెట్టింగులు',
  'nav.logout': 'లాగ్అవుట్',
  'nav.login': 'లాగిన్',
  'nav.role.admin': 'క్లబ్ అడ్మినిస్ట్రేటర్',
  'nav.role.player': 'క్లబ్ సభ్యుడు',

  // Actions & Buttons
  'action.addGame': 'కొత్త ఆట',
  'action.addPlayer': 'సభ్యుడిని చేర్చండి',
  'action.recordPayment': 'చెల్లింపు నమోదు',
  'action.settleNow': 'బకాయి సెటిల్ చేయండి',
  'action.exportCsv': 'CSV ఎగుమతి',
  'action.save': 'భద్రపరచు',
  'action.cancel': 'రద్దు చేయి',
  'action.confirm': 'నిర్ధారించు',
  'action.calculate': 'విభజన లెక్కించు',
  'action.invite': 'సభ్యుడిని ఆహ్వానించండి',
  'action.copyLink': 'లింక్ కాపీ చేయి',
  'action.deactivate': 'నిష్క్రియం చేయి',
  'action.activate': 'క్రియాశీలం చేయి',
  'action.viewDetails': 'వివరాలు చూడండి',
  'action.recordAttendance': 'హాజరు నమోదు',
  'action.verify': 'ధృవీకరించి ఆమోదించు',
  'action.reject': 'తిరస్కరించు',

  // Dashboard Stats
  'stat.activePlayers': 'క్రియాశీల క్రీడాకారులు',
  'stat.upcomingGames': 'రాబోయే ఆటలు',
  'stat.monthlyExpenses': 'నెలవారీ ఖర్చులు',
  'stat.paymentsCollected': 'వసూలైన చెల్లింపులు',
  'stat.outstandingBalance': 'చెల్లించాల్సిన బకాయిలు',
  'stat.totalGames': 'మొత్తం ఆడిన ఆటలు',
  'stat.myShare': 'నా మొత్తం వాటా',
  'stat.myPaid': 'చెల్లించిన మొత్తం',
  'stat.myBalance': 'చెల్లించాల్సిన మొత్తం',

  // Game Management
  'game.title': 'సెషన్ శీర్షిక',
  'game.courtName': 'కోర్టు పేరు',
  'game.location': 'స్థలం',
  'game.date': 'తేదీ',
  'game.time': 'సమయం',
  'game.courtCost': 'కోర్టు బుకింగ్ ఖర్చు',
  'game.shuttleCost': 'షటిల్‌కాక్ ఖర్చులు',
  'game.additionalCost': 'ఇతర ఖర్చులు',
  'game.totalCost': 'మొత్తం ఖర్చు',
  'game.organizer': 'నిర్వాహకుడు',
  'game.participants': 'పాల్గొనేవారు',
  'game.attended': 'హాజరయ్యారు',
  'game.absent': 'హాజరుకాలేదు',
  'game.notes': 'గమనికలు',
  'game.splitType': 'ఖర్చు విభజన పద్ధతి',
  'game.status': 'స్థితి',
  'game.financialConfirmed': 'ఆర్థికంగా నిర్ధారించబడింది',

  // Expense Splitting
  'split.equal': 'సమాన విభజన',
  'split.customFixed': 'నిర్దిష్ట మొత్తం విభజన',
  'split.customPercentage': 'శాతం విభజన (%)',
  'split.perPerson': 'ఒక్కొక్కరి వాటా',
  'split.reconciledNotice': 'పైసలతో సహా సరిగ్గా సరిపోయింది: మొత్తం 100% సరిపోయింది.',
  'split.confirmNotice': 'హాజరు మార్చడం వల్ల ఆర్థిక రికార్డులు మారుతాయి. దయచేసి నిర్ధారించండి.',
  'split.preview': 'ఖర్చుల విభజన ప్రివ్యూ',

  // Payments & Statuses
  'status.paid': 'చెల్లించబడింది',
  'status.pending': 'బకాయి ఉంది',
  'status.partiallyPaid': 'పాక్షికంగా చెల్లించబడింది',
  'status.scheduled': 'షెడ్యూల్ చేయబడింది',
  'status.completed': 'పూర్తయింది',
  'status.cancelled': 'రద్దు చేయబడింది',
  'status.pendingVerification': 'పరిశీలనలో ఉంది',
  'status.settled': 'సెటిల్ చేయబడింది',

  // Settlement & Who Owes Whom
  'settlement.whoOwesWhom': 'ఎవరు ఎవరికి ఇవ్వాలి (రుణాల సరళీకరణ)',
  'settlement.owes': 'ఇవ్వాలి',
  'settlement.receives': 'రావాలి',
  'settlement.netBalance': 'నికర బకాయి',
  'settlement.allSettled': 'అన్ని బకాయిలు పూర్తయ్యాయి! ఏ బకాయిలూ లేవు.',
  'settlement.organizerReimbursement': 'నిర్వాహకుడి అడ్వాన్సులు & వాపసులు',

  // Player Management
  'player.uniqueId': 'క్రీడాకారుడి ID',
  'player.name': 'పూర్తి పేరు',
  'player.mobile': 'మొబైల్ నంబర్',
  'player.email': 'ఇమెయిల్',
  'player.joinDate': 'చేరిన తేదీ',
  'player.status': 'ఖాతా స్థితి',
  'player.active': 'యాక్టివ్',
  'player.inactive': 'ఇన్యాక్టివ్',
  'player.financialSummary': 'ఆర్థిక సారాంశం',

  // Reports
  'report.monthlyTrends': 'నెలవారీ ఖర్చులు & చెల్లింపులు',
  'report.categoryBreakdown': 'ఖర్చుల వర్గీకరణ',
  'report.playerStatements': 'క్రీడాకారుల ఆర్థిక స్టేట్‌మెంట్లు',
  'report.searchPlaceholder': 'కోర్టు, తేదీ లేదా నిర్వాహకుడి ఆధారంగా వెతకండి...',

  // Messages & Alerts
  'msg.success': 'విజయవంతంగా పూర్తయింది.',
  'msg.error': 'లోపం జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
  'msg.paymentRecorded': '₹{amount} చెల్లింపు విజయవంతంగా నమోదైంది.',
  'msg.copied': 'ఆహ్వాన లింక్ కాపీ చేయబడింది!'
};
