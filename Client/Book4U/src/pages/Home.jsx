import HeroSection from '../components/home/HeroSection';
import CategoryList from '../components/home/CategoryList';
import Section from '../components/home/Section';
import BookCard from '../components/home/BookCard';

// Dữ liệu fake (import từ file seed hoặc tạm dán vào)
import { products } from '../data/products';

function Home() {
    const featuredBooks = products.filter((p) => p.isFeatured);
    const aiSuggested = products.filter((p) => p.rating >= 4.5);

    return (
        <div className="space-y-10">
            <HeroSection />
            <CategoryList />

            <Section title="🤖 Gợi ý từ AI cho bạn" viewAll>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {aiSuggested.map((b, i) => (
                        <BookCard key={i} {...b} />
                    ))}
                </div>
            </Section>

            <Section title="📚 Sách nổi bật trong tuần">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {featuredBooks.map((b, i) => (
                        <BookCard key={i} {...b} />
                    ))}
                </div>
            </Section>
        </div>
    );
}

export default Home;
