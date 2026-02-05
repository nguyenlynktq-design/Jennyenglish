// ===== FIXED READING PASSAGES BY LEVEL =====
// Each level has 2 passages:
// 1. For Reading MCQ (5 questions with A/B/C choices)
// 2. For True/False (5 questions)

import { VocabularyLevel } from '../types';

export const FIXED_PASSAGES: Record<VocabularyLevel, {
    readingMCQ: { title: string; passage: string; translation: string };
    trueFalse: { title: string; passage: string; translation: string };
}> = {
    A1: {
        readingMCQ: {
            title: "My Daily Routine",
            passage: "My name is Lan. I am 12 years old. I live in Hanoi with my family. Every day, I wake up at 6 o'clock. I brush my teeth and wash my face. Then I have breakfast with my mother and father. I eat rice and eggs. After breakfast, I go to school. I walk to school because it is near my house. I like school very much. I have many friends there.",
            translation: "Tên tôi là Lan. Tôi 12 tuổi. Tôi sống ở Hà Nội với gia đình. Mỗi ngày, tôi thức dậy lúc 6 giờ. Tôi đánh răng và rửa mặt. Sau đó tôi ăn sáng với mẹ và bố. Tôi ăn cơm và trứng. Sau bữa sáng, tôi đi học. Tôi đi bộ đến trường vì nó gần nhà tôi. Tôi thích trường học lắm. Tôi có nhiều bạn ở đó."
        },
        trueFalse: {
            title: "My Family",
            passage: "I have a small family. There are four people in my family: my father, my mother, my brother,  and me. My father is a teacher. He is 40 years old. My mother is a nurse. She is 38 years old. My brother is 8 years old. He is a student. We live in a big house. I love my family very much.",
            translation: "Tôi có một gia đình nhỏ. Có bốn người trong gia đình tôi: bố tôi, mẹ tôi, anh trai tôi và tôi. Bố tôi là giáo viên. Ông 40 tuổi. Mẹ tôi là y tá. Bà 38 tuổi. Anh trai tôi 8 tuổi. Em ấy là học sinh. Chúng tôi sống trong một ngôi nhà lớn. Tôi yêu gia đình tôi rất nhiều."
        }
    },
    A2: {
        readingMCQ: {
            title: "A Trip to the Beach",
            passage: "Last summer, my family went to Da Nang for a holiday. We stayed there for five days. The beach was beautiful and the water was very clean. Every morning, we swam in the sea and built sandcastles. In the afternoon, we visited some interesting places like the Dragon Bridge and Marble Mountains. The food was delicious, especially the seafood. I ate fresh fish and shrimp every day. We took many photos because we wanted to remember this wonderful trip. I hope we can go back next year.",
            translation: "Mùa hè năm ngoái, gia đình tôi đi Đà Nẵng nghỉ mát. Chúng tôi ở đó năm ngày. Bãi biển rất đẹp và nước rất sạch. Mỗi sáng, chúng tôi bơi trong biển và xây lâu đài cát. Buổi chiều, chúng tôi thăm một số địa điểm thú vị như Cầu Rồng và Ngũ Hành Sơn. Đồ ăn rất ngon, đặc biệt là hải sản. Tôi ăn cá tươi và tôm mỗi ngày. Chúng tôi chụp nhiều ảnh vì muốn nhớ chuyến đi tuyệt vời này. Tôi hy vọng chúng tôi có thể quay lại năm sau."
        },
        trueFalse: {
            title: "My Hobbies",
            passage: "I have many hobbies. I like reading books, playing sports, and listening to music. My favorite sport is badminton. I play badminton with my friends every Saturday. I also like reading comic books and adventure stories. In my free time, I listen to pop music. My favorite singer is Son Tung M-TP. Sometimes I watch movies with my family on weekends. I think hobbies make my life more interesting and fun.",
            translation: "Tôi có nhiều sở thích. Tôi thích đọc sách, chơi thể thao và nghe nhạc. Môn thể thao yêu thích của tôi là cầu lông. Tôi chơi cầu lông với bạn bè mỗi thứ Bảy. Tôi cũng thích đọc truyện tranh và truyện phiêu lưu. Lúc rảnh, tôi nghe nhạc pop. Ca sĩ yêu thích của tôi là Sơn Tùng M-TP. Đôi khi tôi xem phim với gia đình vào cuối tuần. Tôi nghĩ sở thích làm cuộc sống của tôi thú vị và vui hơn."
        }
    },
    B1: {
        readingMCQ: {
            title: "The Importance of Learning English",
            passage: "Nowadays, English is one of the most important languages in the world. It is used in many countries for business, education, and travel. Although learning a new language can be difficult, there are many benefits to speaking English well. Firstly, it opens doors to better job opportunities because many international companies require English skills. Secondly, you can communicate with people from different cultures, which helps you understand the world better. However, learning English requires practice and patience. You should try to read books, watch movies, and speak with native speakers whenever possible. If you study regularly, you will improve quickly.",
            translation: "Ngày nay, tiếng Anh là một trong những ngôn ngữ quan trọng nhất trên thế giới. Nó được sử dụng ở nhiều quốc gia cho kinh doanh, giáo dục và du lịch. Mặc dù học một ngôn ngữ mới có thể khó khăn, nhưng có nhiều lợi ích khi nói tiếng Anh tốt. Thứ nhất, nó mở ra cơ hội việc làm tốt hơn vì nhiều công ty quốc tế yêu cầu kỹ năng tiếng Anh. Thứ hai, bạn có thể giao tiếp với người từ các nền văn hóa khác nhau, giúp bạn hiểu thế giới tốt hơn. Tuy nhiên, học tiếng Anh đòi hỏi sự luyện tập và kiên nhẫn. Bạn nên cố đọc sách, xem phim và nói chuyện với người bản xứ bất cứ khi nào có thể. Nếu bạn học đều đặn, bạn sẽ tiến bộ nhanh chóng."
        },
        trueFalse: {
            title: "The Benefits of Exercise",
            passage: "Regular exercise is essential for maintaining good health. When you exercise, your body becomes stronger and healthier. Exercise helps you control your weight, reduces stress, and improves your mood. Doctors recommend at least 30 minutes of physical activity every day. This can include walking, running, swimming, or playing sports. Moreover, exercising with friends makes it more enjoyable and helps you stay motivated. Although many people think they don't have time for exercise, even short activities like taking the stairs instead of the elevator can make a difference. Remember, staying active is not just good for your body, but also for your mind.",
            translation: "Tập thể dục thường xuyên là điều cần thiết để duy trì sức khỏe tốt. Khi bạn tập thể dục, cơ thể bạn trở nên mạnh mẽ và khỏe mạnh hơn. Tập thể dục giúp bạn kiểm soát cân nặng, giảm căng thẳng và cải thiện tâm trạng. Các bác sĩ khuyến nghị ít nhất 30 phút hoạt động thể chất mỗi ngày. Điều này có thể bao gồm đi bộ, chạy bộ, bơi lội hoặc chơi thể thao. Hơn nữa, tập thể dục với bạn bè khiến nó thú vị hơn và giúp bạn duy trì động lực. Mặc dù nhiều người nghĩ họ không có thời gian tập thể dục, ngay cả những hoạt động ngắn như đi cầu thang thay vì thang máy cũng có thể tạo ra sự khác biệt. Hãy nhớ rằng, duy trì hoạt động không chỉ tốt cho cơ thể mà còn cho tâm trí của bạn."
        }
    }
};

// Helper function
export function getPassagesForLevel(level: VocabularyLevel) {
    return FIXED_PASSAGES[level];
}
