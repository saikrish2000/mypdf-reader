import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FlowButton } from "@/components/ui/flow-button";

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.43, 0.13, 0.23, 0.96],
      delayChildren: 0.1,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const numberVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction * 40,
    y: 15,
    rotate: direction * 5,
  }),
  visible: {
    opacity: 0.7,
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const ghostVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 15, rotate: -5 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  hover: {
    scale: 1.1,
    y: -10,
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      rotate: {
        duration: 2,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  },
  floating: {
    y: [-5, 5],
    transition: {
      y: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  },
};

const NotFound = () => {
  const location = useLocation();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-8 md:mb-12">
            <motion.span
              className="text-[80px] md:text-[120px] font-bold text-foreground opacity-20 select-none"
              variants={numberVariants}
              custom={-1}
            >
               4
            </motion.span>
            <motion.div variants={ghostVariants} whileHover="hover" animate={["visible", "floating"]}>
              {imgError ? (
                <span className="text-6xl select-none" role="img" aria-label="Ghost">👻</span>
              ) : (
                <img
                  src="https://xubohuah.github.io/xubohua.top/Group.png"
                  alt="Ghost"
                  width={120}
                  height={120}
                  className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] object-contain select-none"
                  draggable={false}
                  onError={() => setImgError(true)}
                />
              )}
            </motion.div>
            <motion.span
              className="text-[80px] md:text-[120px] font-bold text-foreground opacity-20 select-none"
              variants={numberVariants}
              custom={1}
            >
               4
            </motion.span>
          </div>

          <motion.h1
            className="text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-6 opacity-70 select-none"
            variants={itemVariants}
          >
            Boo! Page missing!
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-foreground mb-8 md:mb-12 opacity-50 select-none"
            variants={itemVariants}
          >
            Whoops! This page must be a ghost - it&apos;s not here!
          </motion.p>

          <motion.div variants={itemVariants} className="flex justify-center">
            <a href="/">
              <FlowButton text="Find shelter" />
            </a>
          </motion.div>


        </motion.div>
    </div>
  );
};

export default NotFound;
