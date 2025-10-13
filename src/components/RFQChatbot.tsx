import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Package, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  options?: Array<{ label: string; action: string }>;
  products?: Array<{ _id: string; name: string; categoryId: string }>;
  showContactForm?: boolean;
};

type ConversationState = 
  | "initial" 
  | "how_it_works" 
  | "search_product" 
  | "showing_products" 
  | "contact_form"
  | "processing";

export default function RFQChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationState, setConversationState] = useState<ConversationState>("initial");
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", product: "" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const products = useQuery(api.products.getProducts, {});
  const sendAdminMessage = useMutation(api.notifications.sendAdminContactMessage);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text: string, isBot: boolean, options?: Message["options"], products?: Message["products"], showContactForm?: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot,
      options,
      products,
      showContactForm,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage(
          "👋 Welcome! Let our AI agent help you find medical supplies and submit RFQs.",
          true,
          [
            { label: "🔍 Search Products", action: "search" },
            { label: "ℹ️ How It Works", action: "how_it_works" },
          ]
        );
      }, 500);
    }
  };

  const handleOptionClick = (action: string) => {
    if (action === "how_it_works") {
      addMessage("How It Works", false);
      setConversationState("how_it_works");
      setTimeout(() => {
        addMessage(
          `Here's how our platform works:

1️⃣ **Search Products** - Browse our catalog of medical equipment and supplies
2️⃣ **Select Items** - Choose the products you need and add them to your RFQ cart
3️⃣ **Submit RFQ** - Submit a Request for Quotation with your requirements
4️⃣ **Get Quotes** - Receive competitive quotations from verified vendors
5️⃣ **Choose Best Offer** - Review quotes and select the vendor that meets your needs

Would you like to search for products now?`,
          true,
          [
            { label: "🔍 Search Products", action: "search" },
            { label: "🏠 Start Over", action: "reset" },
          ]
        );
      }, 800);
    } else if (action === "search") {
      addMessage("Search Products", false);
      setConversationState("search_product");
      setTimeout(() => {
        addMessage(
          "Great! Please type the name of the medical product you're looking for (e.g., Hospital Bed, Wheelchair, Surgical Gloves):",
          true
        );
      }, 500);
    } else if (action === "reset") {
      setMessages([]);
      setConversationState("initial");
      setSearchQuery("");
      setContactForm({ name: "", email: "", phone: "", product: "" });
      setTimeout(() => {
        addMessage(
          "👋 Welcome! Let our AI agent help you find medical supplies and submit RFQs.",
          true,
          [
            { label: "🔍 Search Products", action: "search" },
            { label: "ℹ️ How It Works", action: "how_it_works" },
          ]
        );
      }, 300);
    } else if (action === "cant_find") {
      addMessage("Can't find the product", false);
      setConversationState("contact_form");
      setTimeout(() => {
        addMessage(
          "No problem! Please fill out the form below and we'll help you find it. Our admin team will contact you shortly.",
          true,
          undefined,
          undefined,
          true
        );
      }, 500);
    } else if (action === "view_all") {
      navigate("/browse");
      toast.success("Opening product catalog...");
    }
  };

  const handleProductClick = (productId: string, productName: string) => {
    addMessage(productName, false);
    navigate(`/product/${productId}`);
    toast.success("Opening product details...");
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    if (conversationState === "search_product") {
      const query = inputValue.trim();
      addMessage(query, false);
      setSearchQuery(query);
      setInputValue("");
      setConversationState("showing_products");

      setTimeout(() => {
        const filteredProducts = products?.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (filteredProducts && filteredProducts.length > 0) {
          addMessage(
            `I found ${filteredProducts.length} product${filteredProducts.length > 1 ? "s" : ""} matching "${query}":`,
            true,
            [
              { label: "🔍 Search Again", action: "search" },
              { label: "📦 Browse All Products", action: "view_all" },
              { label: "❌ Can't Find Product", action: "cant_find" },
            ],
            filteredProducts.map(p => ({ _id: p._id, name: p.name, categoryId: p.categoryId }))
          );
        } else {
          addMessage(
            `I couldn't find any products matching "${query}". Would you like to tell us what you're looking for?`,
            true,
            [
              { label: "🔍 Search Again", action: "search" },
              { label: "📦 Browse All Products", action: "view_all" },
              { label: "📝 Request Product", action: "cant_find" },
            ]
          );
        }
      }, 800);
    }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.phone || !contactForm.product) {
      toast.error("Please fill out all fields");
      return;
    }

    setConversationState("processing");
    addMessage("Submitting request...", false);

    try {
      await sendAdminMessage({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        productRequest: contactForm.product,
      });

      setTimeout(() => {
        addMessage(
          "✅ Thank you! Your request has been sent to our admin team. We'll contact you shortly to help you find the product you need.",
          true,
          [
            { label: "🏠 Start Over", action: "reset" },
          ]
        );
        setContactForm({ name: "", email: "", phone: "", product: "" });
        setConversationState("initial");
      }, 800);
    } catch (error) {
      toast.error("Failed to send request. Please try again.");
      setConversationState("contact_form");
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          size="icon"
          className="fixed bottom-6 right-6 size-16 rounded-full shadow-lg z-50 animate-bounce"
        >
          <MessageCircle className="size-8" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-card border-2 border-border rounded-2xl shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5" />
              <div>
                <h3 className="font-semibold">RFQ Assistant</h3>
                <p className="text-xs opacity-90">Here to help you</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  <div className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.isBot
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                    </div>
                  </div>

                  {/* Product Results */}
                  {message.products && message.products.length > 0 && (
                    <div className="space-y-2 ml-2">
                      {message.products.map((product) => (
                        <button
                          key={product._id}
                          onClick={() => handleProductClick(product._id, product.name)}
                          className="w-full text-left p-3 bg-background border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <Package className="size-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{product.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Options */}
                  {message.options && (
                    <div className="flex flex-wrap gap-2 ml-2">
                      {message.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleOptionClick(option.action)}
                          className="text-xs"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Contact Form */}
                  {message.showContactForm && (
                    <form onSubmit={handleContactFormSubmit} className="space-y-3 ml-2 p-4 bg-background border border-border rounded-lg">
                      <div>
                        <Input
                          placeholder="Your Name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          type="email"
                          placeholder="Your Email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Phone Number"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Textarea
                          placeholder="Describe the product you're looking for..."
                          value={contactForm.product}
                          onChange={(e) => setContactForm({ ...contactForm, product: e.target.value })}
                          rows={3}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={conversationState === "processing"}>
                        {conversationState === "processing" ? (
                          <>
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          "Submit Request"
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          {conversationState === "search_product" && (
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type product name..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon" disabled={!inputValue.trim()}>
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
