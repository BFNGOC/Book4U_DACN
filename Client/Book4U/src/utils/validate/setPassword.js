export const validateSetPassword = (formData) => {
    const errors = {};

    if (!formData.password || formData.password.length < 6) {
        errors.password = 'Mật khẩu phải có ít nhất 6 từ!';
    }

    if (!formData.confirmPassword || formData.confirmPassword !== formData.password) {
        errors.confirmPassword = 'Xác nhận mật khẩu sai!';
    }

    return errors;
};
