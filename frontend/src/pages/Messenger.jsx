import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import { saveOfflineMessage } from "../services/offline";
import { Send, Image, MoreVertical, Phone, X, ArrowLeft } from "lucide-react";

const Messenger = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);

  // Poll for messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get("messages/");
        setAllMessages(res.data);

        // Mark as read for active conversation
        if (activeConversation) {
          const relevantMessages = res.data.filter((msg) => {
            const senderId =
              typeof msg.sender === "object" ? msg.sender.id : msg.sender;
            const receiverId =
              typeof msg.receiver === "object" ? msg.receiver.id : msg.receiver;
            return (
              (senderId == user.user_id &&
                receiverId == activeConversation.id) ||
              (senderId == activeConversation.id && receiverId == user.user_id)
            );
          });

          relevantMessages.forEach(async (msg) => {
            const receiverId =
              typeof msg.receiver === "object" ? msg.receiver.id : msg.receiver;
            if (receiverId == user.user_id && !msg.is_read) {
              await api.post(`messages/${msg.id}/mark_read/`);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching messages", error);
      }
    };

    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    fetchMessages();
    return () => clearInterval(interval);
  }, [activeConversation, user.user_id]);

  // Derive stats
  const conversationsWithStats = conversations.map((conv) => {
    const convMessages = allMessages
      .filter((msg) => {
        const senderId =
          typeof msg.sender === "object" ? msg.sender.id : msg.sender;
        const receiverId =
          typeof msg.receiver === "object" ? msg.receiver.id : msg.receiver;
        return (
          (senderId == user.user_id && receiverId == conv.id) ||
          (senderId == conv.id && receiverId == user.user_id)
        );
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const lastMsg =
      convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;
    const unreadCount = convMessages.filter((msg) => {
      const receiverId =
        typeof msg.receiver === "object" ? msg.receiver.id : msg.receiver;
      return receiverId == user.user_id && !msg.is_read;
    }).length;

    // Online status (5 mins threshold)
    const isOnline =
      conv.lastSeen && new Date() - new Date(conv.lastSeen) < 5 * 60 * 1000;

    return {
      ...conv,
      lastMessage: lastMsg,
      unreadCount,
      isOnline,
    };
  });

  const activeMessages = allMessages.filter((msg) => {
    if (!activeConversation) return false;
    const senderId =
      typeof msg.sender === "object" ? msg.sender.id : msg.sender;
    const receiverId =
      typeof msg.receiver === "object" ? msg.receiver.id : msg.receiver;
    return (
      (senderId == user.user_id && receiverId == activeConversation.id) ||
      (senderId == activeConversation.id && receiverId == user.user_id)
    );
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  useEffect(() => {
    // Fetch eligible partners (Patients for Provider, Provider for Patient)
    const fetchPartners = async () => {
      try {
        if (user.role === "provider") {
          const res = await api.get("patients/");
          // Transform to standardized partner object
          setConversations(
            res.data.map((p) => ({
              id: p.user.id,
              name: p.full_name,
              role: "Patient",
              lastSeen: p.user.last_seen,
            })),
          );
        } else {
          // Patient: fetch their provider
          // Since we don't have a direct "get my provider" endpoint easily exposed besides provider-link,
          // we'll assume the provider who created them.
          // For now, let's just get the provider from the first available link or hardcode
          // In a real app, /providers/me/ or similar.
          // Let's use a workaround: list providers (we made an endpoint)
          const res = await api.get("providers-list/");
          setConversations(
            res.data.map((p) => ({
              id: p.id,
              name: p.username, // Provider model doesn't have full_name on User, assume username or profile
              role: "Provider",
              lastSeen: p.last_seen,
              phone: p.phone || "", // Add phone from User model
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching partners", error);
      }
    };
    fetchPartners();
  }, [user.role]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !image) return;

    const formData = new FormData();
    formData.append("receiver_id", activeConversation.id);
    formData.append("message", newMessage);
    if (image) {
      formData.append("image", image);
    }

    try {
      await api.post("messages/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewMessage("");
      setImage(null);
      // Optimistic update or wait for poll
    } catch (error) {
      console.error("Error sending", error);
      // Offline fallback (only for text messages for now, images are harder)
      if (!image && newMessage.trim()) {
        const offlineMsg = {
          id: `temp-${Date.now()}`,
          sender: user.user_id, // Store ID for consistency with backend expectation in some contexts, or full object if needed by UI
          // But wait, the UI expects sender to be an object or ID.
          // The sync logic needs `receiver_id` and `message`.

          receiver_id: activeConversation.id,
          message: newMessage,
          timestamp: new Date().toISOString(),
          is_read: false,
          pending: true, // UI flag
        };

        await saveOfflineMessage(offlineMsg);

        // Optimistically add to UI
        // We need to shape it like the API response
        const uiMsg = {
          ...offlineMsg,
          sender: user.user_id, // matching how we filter
          receiver: activeConversation.id,
        };

        setAllMessages([...allMessages, uiMsg]);
        setNewMessage("");
      }
    }
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Sidebar */}
      <div
        className={`w-full md:w-1/3 bg-white border-r border-neutral-200 flex flex-col ${
          activeConversation ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-neutral-200 font-bold text-lg flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          Messages
        </div>
        <div className="overflow-y-auto flex-1">
          {conversationsWithStats.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className={`p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 ${activeConversation?.id === conv.id ? "bg-neutral-100" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{conv.name}</span>
                    {conv.isOnline && (
                      <div
                        className="w-2 h-2 bg-green-500 "
                        title="Online"
                      ></div>
                    )}
                  </div>
                  <div className="text-sm text-neutral-500 truncate mt-1">
                    {conv.lastMessage ? (
                      <span>
                        {conv.lastMessage.sender == user.user_id ? "You: " : ""}
                        {conv.lastMessage.message || "Sent an image"}
                      </span>
                    ) : (
                      <span className="italic text-neutral-400">
                        No messages yet
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {conv.lastMessage && (
                    <span className="text-[10px] text-neutral-400">
                      {new Date(conv.lastMessage.timestamp).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  )}
                  {conv.unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5  min-w-[1.25rem] text-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-4 text-neutral-400">No contacts found</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex-col ${
          !activeConversation ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-neutral-200 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-2 -ml-2 hover:bg-neutral-100 "
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-bold">{activeConversation.name}</h2>
              </div>
              <div className="flex gap-2">
                {activeConversation.phone && (
                  <a
                    href={`tel:${activeConversation.phone}`}
                    className="p-2 hover:bg-neutral-100  flex items-center justify-center text-black"
                    title={`Call ${activeConversation.phone}`}
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                )}
                <button className="p-2 hover:bg-neutral-100 ">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
              {activeMessages.map((msg) => {
                const senderId =
                  typeof msg.sender === "object" ? msg.sender.id : msg.sender;
                const isMe = senderId == user.user_id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%]  p-3 ${isMe ? "bg-black text-white -none" : "bg-white text-black border border-neutral-200 -none"}`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="attachment"
                          className=" mb-2 max-h-48 object-cover cursor-pointer hover:opacity-90 transition"
                          onClick={() => setSelectedImage(msg.image)}
                        />
                      )}
                      <p>{msg.message}</p>
                      <div
                        className={`text-[10px] mt-1 text-right ${isMe ? "text-neutral-400" : "text-neutral-400"}`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isMe && (msg.is_read ? " • Read" : " • Sent")}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-neutral-200">
              {image && (
                <div className="mb-2 p-2 bg-neutral-100  flex justify-between items-center w-max relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    className="h-20 w-auto  object-cover"
                  />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white  w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600 transition"
                  >
                    ×
                  </button>
                  <span className="ml-2 text-xs truncate max-w-xs block">
                    {image.name}
                  </span>
                </div>
              )}
              <form onSubmit={handleSend} className="flex gap-2 items-center">
                <label className="cursor-pointer p-2 hover:bg-neutral-100  text-neutral-500 transition">
                  <Image className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-neutral-300  px-4 focus:ring-2 ring-black outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !image}
                  className="p-2 bg-black text-white  hover:bg-neutral-800 disabled:opacity-50 transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {/* Image Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 "
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Full preview"
            className="max-w-full max-h-full  object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Messenger;
