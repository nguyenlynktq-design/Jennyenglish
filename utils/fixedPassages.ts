// ===== FIXED READING PASSAGES BY LEVEL =====
// These are constant templates that do not change between generations

import { VocabularyLevel } from '../types';

export const FIXED_PASSAGES: Record<VocabularyLevel, { title: string; passage: string; translation: string }> = {
    A1: {
        title: "My Daily Routine",
        passage: `My name is Lan. I am 12 years old. I live in Hanoi with my family. Every day, I wake up at 6 o'clock. I brush my teeth and wash my face. Then I have breakfast with my mother and father. I eat rice and eggs. After breakfast, I go to school. I walk to school because it is near my house. I like school very much. I have many friends there.`,
        translation: `Tên tôi là Lan. Tôi 12 tuổi. Tôi sống ở Hà Nội với gia đình. Mỗi ngày, tôi thức dậy lúc 6 giờ. Tôi đánh răng và rửa mặt. Sau đó tôi ăn sáng với mẹ và bố. Tôi ăn cơm và trứng. Sau bữa sáng, tôi đi học. Tôi đi bộ đến trường vì nó gần nhà tôi. Tôi thích trường học lắm. Tôi có nhiều bạn ở đó.`
    },
    A2: {
        title: "A Trip to the Beach",
        passage: `Last summer, my family went to Da Nang for a holiday. We stayed there for five days. The beach was beautiful and the water was very clean. Every morning, we swam in the sea and built sandcastles. In the afternoon, we visited some interesting places like the Dragon Bridge and Marble Mountains. The food was delicious, especially the seafood. I ate fresh fish and shrimp every day. We took many photos because we wanted to remember this wonderful trip. I hope we can go back next year.`,
        translation: `Mùa hè năm ngoái, gia đình tôi đi Đà Nẵng nghỉ mát. Chúng tôi ở đó năm ngày. Bãi biển rất đẹp và nước rất sạch. Mỗi sáng, chúng tôi bơi trong biển và xây lâu đài cát. Buổi chiều, chúng tôi thăm một số địa điểm thú vị như Cầu Rồng và Ngũ Hành Sơn. Đồ ăn rất ngon, đặc biệt là hải sản. Tôi ăn cá tươi và tôm mỗi ngày. Chúng tôi chụp nhiều ảnh vì muốn nhớ chuyến đi tuyệt vời này. Tôi hy vọng chúng tôi có thể quay lại năm sau.`
    },
    B1: {
        title: "The Importance of Learning English",
        passage: `Nowadays, English is one of the most important languages in the world. It is used in many countries for business, education, and travel. Although learning a new language can be difficult, there are many benefits to speaking English well. Firstly, it opens doors to better job opportunities because many international companies require English skills. Secondly, you can communicate with people from different cultures, which helps you understand the world better. However, learning English requires practice and patience. You should try to read books, watch movies, and speak with native speakers whenever possible. If you study regularly, you will improve quickly.`,
        translation: `Ngày nay, tiếng Anh là một trong những ngôn ngữ quan trọng nhất trên thế giới. Nó được sử dụng ở nhiều quốc gia cho kinh doanh, giáo dục và du lịch. Mặc dù học một ngôn ngữ mới có thể khó khăn, nhưng có nhiều lợi ích khi nói tiếng Anh tốt. Thứ nhất, nó mở ra cơ hội việc làm tốt hơn vì nhiều công ty quốc tế yêu cầu kỹ năng tiếng Anh. Thứ hai, bạn có thể giao tiếp với người từ các nền văn hóa khác nhau, giúp bạn hiểu thế giới tốt hơn. Tuy nhiên, học tiếng Anh đòi hỏi sự luyện tập và kiên nhẫn. Bạn nên cố đọc sách, xem phim và nói chuyện với người bản xứ bất cứ khi nào có thể. Nếu bạn học đều đặn, bạn sẽ tiến bộ nhanh chóng.`
    }
};

// Word count validation for each level
export const PASSAGE_WORD_COUNTS: Record<VocabularyLevel, { min: number; max: number }> = {
    A1: { min: 60, max: 90 },
    A2: { min: 90, max: 130 },
    B1: { min: 130, max: 170 }
};

export function getPassageForLevel(level: VocabularyLevel) {
    return FIXED_PASSAGES[level];
}
