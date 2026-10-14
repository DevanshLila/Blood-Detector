import re
import sys

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html))

expected_ids = [
    'instrumentSelect', 'conditionSelect', 'instrumentMetaDisplay', 'conditionMetaDisplay',
    'btnSidebarScan', 'scanProgressBar', 'scanStatusText', 'scanProgressContainer',
    'oscilloscopeCanvas', 'sidebarAdcVal', 'spectralBarCanvas', 'btnQuickCSV', 'btnQuickReport',
    'btnToggleSound', 'btnRunDemo', 'deviceViewContainer', 'dashboardViewContainer',
    'resultsSummaryCard', 'historyListContainer',
    'sbBtnModeOff', 'sbBtnModeUv', 'sbBtnModeIr', 'sbBtnModeCombined',
    'sidebarModeTag', 'sidebarThresholdSlider', 'sidebarThresholdVal'
]

missing = [x for x in expected_ids if x not in html_ids]
if missing:
    print('MISSING HTML IDs:', missing)
    sys.exit(1)
else:
    print(f'All {len(expected_ids)} key HTML IDs found in index.html!')
    sys.exit(0)
