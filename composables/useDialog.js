import { ref } from 'vue';

// 弹窗状态
const visible = ref(false);
const type = ref('info');
const message = ref('');
let resolvePromise = null;

// 顶部警告状态
const alertVisible = ref(false);
const alertType = ref('warning');
const alertMessage = ref('');
const alertDuration = ref(3000);

// 显示弹窗
const showDialog = (msg, dialogType = 'info') => {
  message.value = msg;
  type.value = dialogType;
  visible.value = true;

  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
};

// 确认弹窗
const showConfirm = (msg) => {
  return showDialog(msg, 'confirm');
};

// 错误弹窗
const showError = (msg) => {
  return showDialog(msg, 'error');
};

// 成功弹窗
const showSuccess = (msg) => {
  return showDialog(msg, 'success');
};

// 信息弹窗
const showInfo = (msg) => {
  return showDialog(msg, 'info');
};

// 处理确认
const handleConfirm = () => {
  if (resolvePromise) {
    resolvePromise(true);
    resolvePromise = null;
  }
};

// 处理取消
const handleCancel = () => {
  if (resolvePromise) {
    resolvePromise(false);
    resolvePromise = null;
  }
};

// 显示顶部警告
const showAlert = (msg, alertType = 'warning', duration = 3000) => {
  alertMessage.value = msg;
  alertType.value = alertType;
  alertDuration.value = duration;
  alertVisible.value = true;
};

// 关闭顶部警告
const closeAlert = () => {
  alertVisible.value = false;
};

export const useDialog = () => {
  return {
    // Dialog
    visible,
    type,
    message,
    showDialog,
    showConfirm,
    showError,
    showSuccess,
    showInfo,
    handleConfirm,
    handleCancel,
    // Alert
    alertVisible,
    alertType,
    alertMessage,
    alertDuration,
    showAlert,
    closeAlert,
  };
};