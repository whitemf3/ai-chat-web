import { create } from 'zustand'

export type SettingsSection = 'general'

type SettingsDialogState = {
  open: boolean
  section: SettingsSection
}

export const useSettingsDialog = create<SettingsDialogState>(() => ({
  open: false,
  section: 'general',
}))

export const openSettings = (section: SettingsSection = 'general') => {
  useSettingsDialog.setState({ open: true, section })
}

export const closeSettings = () => {
  useSettingsDialog.setState({ open: false })
}
