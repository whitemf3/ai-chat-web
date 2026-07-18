import { ref, nextTick } from 'vue';

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
const alertKey = ref(0);

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
const showAlert = async (msg, alertTypeVal = 'warning', duration = 3000) => {
  // 如果当前有弹窗显示，先关闭它
  if (alertVisible.value) {
    alertVisible.value = false;
    // 等待关闭动画完成
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // 显示新弹窗
  alertMessage.value = msg;
  alertType.value = alertTypeVal;
  alertDuration.value = duration;
  alertKey.value++;
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
    alertKey,
    showAlert,
    closeAlert,
  };
};