import { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/userContext';
import {
    getMessages,
    sendMessage,
    sendFile,
    uploadChatFile,
    markMessagesAsRead,
} from '../../services/api/chatApi';
import { Send, ArrowLeft, AlertCircle, Upload, X } from 'lucide-react';
import Loading from '../common/Loading';

function ChatWindow({ conversationId, otherUser, onBack }) {
    const { user: currentUser } = useUser();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [previewFile, setPreviewFile] = useState(null);

    const inputRef = useRef(null);

    useEffect(() => {
        if (!loading) {
            inputRef.current?.focus();
        }
    }, [conversationId, loading]);

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load messages
    useEffect(() => {
        if (!conversationId || !currentUser) return;

        setLoading(true);
        setError('');

        const unsubscribe = getMessages(conversationId, (msgs) => {
            setMessages(msgs);
            setLoading(false);
        });

        // Mark messages as read
        markMessagesAsRead(conversationId, currentUser._id);

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [conversationId, currentUser]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        setSending(true);
        setError('');

        const result = await sendMessage(conversationId, currentUser._id, newMessage.trim(), {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: currentUser.role,
            storeLogo: currentUser.storeLogo,
            profilePicture: currentUser.profilePicture,
        });

        if (result.success) {
            setNewMessage('');
            requestAnimationFrame(() => inputRef.current?.focus());
        } else {
            setError('Lỗi gửi tin nhắn: ' + result.error);
        }

        setSending(false);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('File quá lớn (tối đa 50MB)');
            return;
        }

        setPreviewFile(file);
    };

    const handleSendFile = async () => {
        if (!previewFile) return;

        setUploading(true);
        setError('');

        try {
            // Upload file lên server
            const uploadResult = await uploadChatFile(previewFile);

            if (!uploadResult.success) {
                throw new Error(uploadResult.error);
            }

            // Gửi file vào database
            const result = await sendFile(conversationId, currentUser._id, uploadResult, {
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                role: currentUser.role,
                storeLogo: currentUser.storeLogo,
                profilePicture: currentUser.profilePicture,
            });

            if (result.success) {
                setPreviewFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                setError('Lỗi gửi file: ' + result.error);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Lỗi upload file: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCancelPreview = () => {
        setPreviewFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (loading) return <Loading context="Đang tải tin nhắn..." />;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 hover:bg-blue-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h3 className="font-semibold text-gray-900">{otherUser?.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">
                            {otherUser?.role === 'seller' ? 'Bán hàng' : 'Khách hàng'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Bắt đầu cuộc trò chuyện</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isOwn = message.senderId === currentUser._id;
                            const isFile = message.isFile;

                            return (
                                <div
                                    key={message.id || index}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs lg:max-w-md rounded-lg ${
                                            isOwn
                                                ? 'bg-blue-500 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                                        }`}
                                    >
                                        {!isOwn && (
                                            <p className="text-xs font-semibold text-gray-600 mb-1 px-4 pt-2">
                                                {message.senderName}
                                            </p>
                                        )}

                                        {isFile ? (
                                            <div className="px-4 py-2">
                                                {message.fileType === 'image' ? (
                                                    <div className="space-y-2">
                                                        <img
                                                            src={`${
                                                                import.meta.env.VITE_API_BASE_URL
                                                            }${message.fileUrl}`}
                                                            alt={message.fileName}
                                                            className="max-w-full h-auto rounded"
                                                        />
                                                        <p className="text-xs">
                                                            {message.fileName}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <a
                                                            href={`${
                                                                import.meta.env.VITE_API_BASE_URL
                                                            }${message.fileUrl}`}
                                                            download={message.fileName}
                                                            className={`flex items-center gap-2 p-2 rounded border-2 ${
                                                                isOwn
                                                                    ? 'border-blue-400 hover:bg-blue-600'
                                                                    : 'border-gray-300 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <Upload className="w-4 h-4" />
                                                            <div className="text-left">
                                                                <p className="text-sm font-semibold truncate">
                                                                    {message.fileName}
                                                                </p>
                                                                <p className="text-xs">
                                                                    {(
                                                                        message.fileSize / 1024
                                                                    ).toFixed(2)}{' '}
                                                                    KB
                                                                </p>
                                                            </div>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="px-4 py-2 text-sm break-words">
                                                {message.text}
                                            </p>
                                        )}

                                        <p
                                            className={`text-xs px-4 pb-2 ${
                                                isOwn ? 'text-blue-100' : 'text-gray-400'
                                            }`}
                                        >
                                            {new Date(message.timestamp).toLocaleTimeString(
                                                'vi-VN',
                                                {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* File Preview */}
            {previewFile && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {previewFile.type.startsWith('image/') ? (
                            <div className="w-12 h-12 rounded border border-blue-300 overflow-hidden">
                                <img
                                    src={URL.createObjectURL(previewFile)}
                                    alt="preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <Upload className="w-12 h-12 text-blue-500" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-900">{previewFile.name}</p>
                            <p className="text-xs text-gray-500">
                                {(previewFile.size / 1024).toFixed(2)} KB
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancelPreview}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-red-500" />
                    </button>
                </div>
            )}

            {/* Input */}
            <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 bg-white flex gap-2"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    disabled={uploading}
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || sending}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
                    title="Gửi file"
                >
                    <Upload className="w-5 h-5 text-gray-600" />
                </button>

                {previewFile ? (
                    <button
                        type="button"
                        onClick={handleSendFile}
                        disabled={uploading}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {uploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {uploading ? 'Đang gửi...' : 'Gửi file'}
                    </button>
                ) : (
                    <>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            disabled={sending}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Gửi
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}

export default ChatWindow;
