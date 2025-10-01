import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
// import { updateProfile } from '../../services/api/userApi'; // API cập nhật profile

function ProfileSetup() {
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('other');
    const [avatar, setAvatar] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fullName.trim()) {
            setError('Vui lòng nhập họ tên');
            return;
        }

        // Chuẩn bị dữ liệu gửi server
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('gender', gender);
        if (avatar) formData.append('avatar', avatar);

        // TODO: gọi API update profile
        // const res = await updateProfile(formData);
        // if (res.error) return setError(res.message);

        navigate('/dashboard'); // hoặc trang home sau khi setup xong
    };

    return (
        <div>
            <h2>Thiết lập hồ sơ</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Họ và tên</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                    />
                </div>

                <div>
                    <label>Giới tính</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                    </select>
                </div>

                <div>
                    <label>Ảnh đại diện</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatar(e.target.files[0])}
                    />
                </div>

                <button type="submit">Hoàn tất</button>
            </form>

            <Link to="/">Bỏ qua</Link>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default ProfileSetup;
