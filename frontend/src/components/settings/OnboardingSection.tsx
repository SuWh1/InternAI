import React, { useState, useEffect } from 'react';
import { Target, Save, Loader2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '../../services/onboardingService';
import type { OnboardingData, OnboardingUpdate, OnboardingOptions } from '../../types/onboarding';

// Tech Stack Mappings - Updated to match OnboardingPage.tsx structure
const TECH_STACK_MAPPINGS = {
  'Full-Stack Web Development': {
    languages: {
      'JavaScript': {
        frameworks: ['React', 'Next.js', 'NestJS', 'Angular', 'Express'],
        tools: ['npm', 'Yarn', 'ESLint', 'Prettier', 'Vite', 'ts-node', 'Postman']
      },
      'TypeScript': {
        frameworks: ['React', 'Next.js', 'NestJS', 'Angular', 'Express'],
        tools: ['npm', 'Yarn', 'ESLint', 'Prettier', 'Vite', 'ts-node', 'Postman']
      },
      'Python': {
        frameworks: ['Django', 'Flask', 'FastAPI', 'Tornado'],
        tools: ['pip', 'Poetry', 'Postman', 'PyCharm', 'Black', 'isort']
      },
      'Java': {
        frameworks: ['Spring', 'Spring Boot', 'Micronaut'],
        tools: ['Maven', 'Gradle', 'IntelliJ IDEA', 'Eclipse', 'Postman']
      },
      'C#': {
        frameworks: ['ASP.NET', 'ASP.NET Core'],
        tools: ['Visual Studio', 'Postman', 'NuGet', 'LINQPad']
      },
      'Go': {
        frameworks: ['Gin', 'Fiber', 'Echo', 'Beego'],
        tools: ['GoLand', 'Delve', 'Postman', 'Air (live reload)', 'Swagger']
      },
      'PHP': {
        frameworks: ['Laravel', 'Symfony', 'CodeIgniter'],
        tools: ['Composer', 'PHPStorm', 'Postman', 'Xdebug']
      },
      'Ruby': {
        frameworks: ['Ruby on Rails', 'Sinatra'],
        tools: ['Bundler', 'Postman', 'Pry', 'RuboCop']
      }
    },
    commonTools: [
      'Git', 'Docker', 'Docker Compose', 'AWS', 'GCP', 'Azure', 'Kubernetes',
      'VS Code', 'WebStorm', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
      'Prisma', 'Sequelize', 'Figma', 'HTML', 'CSS', 'Tailwind CSS', 'Sass/SCSS',
      'Heroku', 'Netlify', 'Vercel', 'Nginx', 'CI/CD (GitHub Actions, CircleCI)'
    ]
  },
  'Frontend Development': {
    languages: {
      'JavaScript': {
        frameworks: [
          'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Gatsby',
          'Ember.js', 'Remix', 'Qwik', 'Astro', 'Svelte', 'Solid.js'
        ],
        tools: [
          'npm', 'Webpack', 'Vite', 'Babel', 'VS Code', 'Chrome DevTools',
          'Figma', 'Git', 'ESLint', 'Prettier', 'Netlify', 'Vercel'
        ]
      },
      'TypeScript': {
        frameworks: [
          'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte',
          'SvelteKit', 'Remix', 'Qwik', 'Solid.js', 'Astro'
        ],
        tools: [
          'npm', 'Webpack', 'Vite', 'ESLint', 'Prettier', 'VS Code',
          'Git', 'Netlify', 'Vercel'
        ]
      },
      'Dart': {
        frameworks: ['Flutter (Web)'],
        tools: ['VS Code', 'Figma', 'Flutter DevTools', 'DartPad']
      },
      'C#': {
        frameworks: ['Blazor'],
        tools: ['Visual Studio', 'Git', 'Rider', 'Live Server']
      },
      'Java': {
        frameworks: ['Vaadin', 'GWT'],
        tools: ['IntelliJ IDEA', 'Git', 'NetBeans']
      },
      'Go': {
        frameworks: ['Vugu'],
        tools: ['VS Code', 'Git', 'GoLand']
      },
      'Rust': {
        frameworks: ['Yew', 'Seed', 'Dioxus'],
        tools: ['VS Code', 'Git', 'Trunk']
      }
    },
    commonTools: [
      'HTML', 'CSS', 'Sass/SCSS', 'Figma', 'Adobe XD', 'Sketch',
      'Netlify', 'Vercel', 'Chrome DevTools'
    ]
  },
  'Backend Development': {
    Python: {
      frameworks: ['Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado', 'Bottle', 'CherryPy', 'Sanic', 'Falcon', 'Responder', 'Quart', 'BlackSheep', 'Starlette', 'Litestar', 'Robyn', 'Hug'],
      tools: ['Celery', 'gRPC', 'SQLAlchemy', 'Alembic', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Java: {
      frameworks: ['Spring', 'Micronaut', 'Dropwizard', 'Javalin', 'Quarkus'],
      tools: ['Hibernate', 'gRPC', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    'C#': {
      frameworks: ['ASP.NET Core'],
      tools: ['Entity Framework', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Go: {
      frameworks: ['Gin', 'Echo', 'Fiber', 'Beego', 'Buffalo', 'Gorilla', 'Chi', 'Iris', 'Revel'],
      tools: ['gRPC', 'Go-SQLite3', 'Ent', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Rust: {
      frameworks: ['Actix-web', 'Rocket', 'Axum', 'Warp', 'Tide'],
      tools: ['Diesel', 'SeaORM', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    PHP: {
      frameworks: ['Laravel', 'Symfony', 'CodeIgniter', 'Yii', 'Zend'],
      tools: ['Eloquent ORM', 'Doctrine', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Ruby: {
      frameworks: ['Ruby on Rails', 'Sinatra', 'Hanami'],
      tools: ['Active Record', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Scala: {
      frameworks: ['Play Framework', 'Akka HTTP', 'http4s'],
      tools: ['Slick', 'Doobie', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Kotlin: {
      frameworks: ['Ktor', 'Spring Boot'],
      tools: ['Exposed ORM', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    Elixir: {
      frameworks: ['Phoenix'],
      tools: ['Ecto', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    JavaScript: {
      frameworks: ['Express', 'NestJS', 'Hapi', 'Koa'],
      tools: ['Mongoose', 'Sequelize', 'TypeORM', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    TypeScript: {
      frameworks: ['Express', 'NestJS', 'Fastify'],
      tools: ['Prisma', 'TypeORM', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    'C++': {
      frameworks: ['CppCMS', 'Crow', 'Pistache', 'Wt'],
      tools: ['SOCI', 'ODB', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL']
    },
    tools: [
      'Docker', 'Kubernetes', 'AWS', 'Postman', 'Git', 'Jenkins',
      'VS Code', 'IntelliJ IDEA', 'PyCharm', 'Heroku', 'Prometheus', 'Grafana',
      'RabbitMQ', 'Kafka', 'Consul', 'Nginx'
    ]
  },
  'Mobile Development': {
    languages: {
      'Swift': {
        frameworks: ['SwiftUI', 'UIKit', 'Combine'],
        tools: ['Xcode', 'TestFlight', 'Instruments', 'CocoaPods', 'SwiftLint']
      },
      'Kotlin': {
        frameworks: ['Jetpack Compose', 'Ktor'],
        tools: ['Android Studio', 'Play Console', 'Gradle', 'Firebase', 'LeakCanary']
      },
      'Java': {
        frameworks: ['Android SDK'],
        tools: ['Android Studio', 'Gradle', 'Firebase', 'Lint']
      },
      'JavaScript': {
        frameworks: ['React Native', 'Expo'],
        tools: ['React Native CLI', 'VS Code', 'Metro Bundler', 'ESLint']
      },
      'TypeScript': {
        frameworks: ['React Native', 'Expo'],
        tools: ['VS Code', 'TypeScript ESLint']
      },
      'Dart': {
        frameworks: ['Flutter'],
        tools: ['Android Studio', 'VS Code', 'Dart DevTools', 'Flutter Inspector']
      },
      'C#': {
        frameworks: ['Xamarin', 'Unity'],
        tools: ['Visual Studio', 'NuGet', 'Unity Hub']
      }
    },
    commonTools: [
      'Git', 'Firebase', 'Supabase', 'Figma', 'Netlify',
      'Vercel', 'Heroku', 'Bitrise', 'Codemagic', 'App Center'
    ]
  },
  'Data Science & Analytics': {
    languages: {
      'Python': {
        frameworks: ['Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'Dask', 'Flask', 'Django', 'FastAPI'],
        tools: ['Jupyter', 'VS Code', 'PyCharm', 'MLflow', 'Apache Airflow']
      },
      'R': {
        frameworks: ['tidyverse', 'Shiny', 'caret'],
        tools: ['RStudio', 'Jupyter', 'Tableau']
      },
      'SQL': {
        frameworks: [],
        tools: ['PostgreSQL', 'MongoDB', 'Redis']
      },
      'Scala': {
        frameworks: ['Apache Spark'],
        tools: ['Jupyter', 'VS Code', 'Databricks']
      },
      'Julia': {
        frameworks: ['Flux.jl', 'MLJ.jl'],
        tools: ['Jupyter', 'VS Code']
      },
      'MATLAB': {
        frameworks: [],
        tools: ['MATLAB IDE']
      },
      'Java': {
        frameworks: ['Apache Spark', 'Deeplearning4j', 'Weka'],
        tools: ['Jupyter', 'IntelliJ IDEA']
      },
      'C++': {
        frameworks: ['Dlib', 'Shark'],
        tools: ['Jupyter', 'Visual Studio']
      },
      'JavaScript': {
        frameworks: ['TensorFlow.js', 'Brain.js', 'Danfo.js'],
        tools: ['VS Code']
      }
    },
    commonTools: ['Docker', 'AWS', 'Git', 'Tableau', 'Databricks', 'Prometheus', 'Grafana']
  },
  'Machine Learning & AI': {
    languages: {
      'Python': {
        frameworks: [
          'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
          'Pandas', 'NumPy', 'Hugging Face', 'LangChain', 'OpenAI', 'Transformers', 'JAX'
        ],
        tools: [
          'Jupyter', 'VS Code', 'PyCharm', 'MLflow', 'Weights & Biases', 'TensorBoard', 'Docker', 'CUDA'
        ]
      },
      'R': {
        frameworks: ['caret', 'mlr', 'tensorflow'],
        tools: ['RStudio', 'Jupyter']
      },
      'Julia': {
        frameworks: ['Flux.jl', 'MLJ.jl'],
        tools: ['Jupyter', 'VS Code']
      },
      'C++': {
        frameworks: ['TensorFlow', 'Torch C++', 'Dlib'],
        tools: ['Visual Studio', 'CUDA']
      },
      'JavaScript': {
        frameworks: ['TensorFlow.js', 'Brain.js'],
        tools: ['VS Code']
      },
      'Java': {
        frameworks: ['DeepLearning4J', 'Weka'],
        tools: ['IntelliJ IDEA']
      },
      'Scala': {
        frameworks: ['Apache Spark MLlib'],
        tools: ['Databricks']
      },
      'Swift': {
        frameworks: ['Core ML', 'Create ML'],
        tools: ['Xcode']
      },
      'C#': {
        frameworks: ['ML.NET'],
        tools: ['Visual Studio']
      }
    },
    commonTools: ['Git', 'Docker', 'AWS', 'Google Cloud', 'Azure', 'Databricks']
  },
  'DevOps & Cloud Infrastructure': {
    languages: {
      'Python': {
        frameworks: ['Ansible', 'Fabric'],
        tools: ['Docker', 'Jenkins', 'Git', 'Prometheus', 'Grafana', 'Vault', 'VS Code', 'GitHub Actions', 'AWS SDK', 'Azure SDK']
      },
      'Go': {
        frameworks: [],
        tools: ['Docker', 'Kubernetes', 'Prometheus', 'Grafana', 'Consul', 'Vault', 'Terraform', 'Git']
      },
      'JavaScript': {
        frameworks: ['Node.js', 'Express'],
        tools: ['VS Code', 'GitHub Actions', 'ESLint', 'npm', 'Docker']
      },
      'Bash': {
        frameworks: [],
        tools: ['Git', 'Docker', 'Jenkins', 'Kubernetes', 'Ansible', 'Helm']
      },
      'PowerShell': {
        frameworks: [],
        tools: ['Azure CLI', 'Windows Server Automation', 'GitHub Actions', 'AWS Tools for PowerShell']
      },
      'Java': {
        frameworks: ['Spring Boot'],
        tools: ['Jenkins', 'Docker', 'Git', 'Maven', 'VS Code', 'IntelliJ', 'Kubernetes']
      },
      'C#': {
        frameworks: ['.NET Core'],
        tools: ['Azure DevOps', 'GitHub Actions', 'Docker', 'VS Code', 'Visual Studio']
      },
      'Ruby': {
        frameworks: ['Rails'],
        tools: ['Chef', 'Puppet', 'GitLab CI', 'Capistrano']
      },
      'Rust': {
        frameworks: [],
        tools: ['Docker', 'Git', 'GitHub Actions', 'cargo-make']
      }
    },
    commonTools: [
      'Docker', 'AWS', 'Azure', 'Google Cloud', 'Kubernetes',
      'Terraform', 'Ansible', 'Helm', 'Jenkins', 'GitHub Actions', 'GitLab CI',
      'Vault', 'Consul', 'Prometheus', 'Grafana',
      'PostgreSQL', 'MongoDB', 'Redis', 'VS Code', 'Git'
    ]
  },
  'Cybersecurity': {
    languages: {
      'Python': {
        frameworks: ['Flask', 'Django', 'Mitmproxy', 'Python-nmap', 'PyShark'],
        tools: ['Scapy', 'pwntools', 'Impacket', 'Burp Suite API', 'Volatility', 'PyCrypto', 'Git', 'VS Code']
      },
      'C': {
        frameworks: [],
        tools: ['GDB', 'Radare2', 'Wireshark', 'Nmap', 'Metasploit', 'Valgrind', 'Make', 'Git']
      },
      'C++': {
        frameworks: [],
        tools: ['Ghidra', 'IDA Pro', 'Wireshark', 'Burp Suite', 'Nmap', 'Clang', 'CMake', 'Git']
      },
      'Java': {
        frameworks: ['Spring Security'],
        tools: ['Burp Suite', 'OWASP ZAP', 'Keycloak', 'Git', 'VS Code', 'IntelliJ']
      },
      'JavaScript': {
        frameworks: ['Node.js', 'Express'],
        tools: ['OWASP ZAP', 'Postman', 'Burp Suite', 'npm', 'ESLint', 'Git']
      },
      'Go': {
        frameworks: [],
        tools: ['Amass', 'httprobe', 'Gobuster', 'Git', 'VS Code']
      },
      'Rust': {
        frameworks: [],
        tools: ['cargo-audit', 'Clippy', 'Git', 'VS Code']
      },
      'PowerShell': {
        frameworks: [],
        tools: ['PowerSploit', 'Empire', 'Windows Defender Evasion', 'Git']
      },
      'Bash': {
        frameworks: [],
        tools: ['Nmap', 'Netcat', 'tcpdump', 'iptables', 'Git']
      }
    },
    commonTools: [
      'Wireshark', 'Nmap', 'Metasploit', 'Burp Suite', 'OWASP ZAP',
      'Kali Linux', 'Parrot OS', 'Docker', 'VS Code', 'Git',
      'PostgreSQL', 'MongoDB', 'MySQL', 'Postman',
      'Ghidra', 'IDA Pro', 'Volatility', 'John the Ripper',
      'Aircrack-ng', 'Nikto', 'Snort', 'Suricata'
    ]
  },
  'Game Development': {
    languages: {
      'C#': {
        frameworks: ['Unity'],
        tools: ['Visual Studio', 'Unity', 'Rider', 'VS Code', 'Git']
      },
      'C++': {
        frameworks: ['Unreal Engine'],
        tools: ['Visual Studio', 'Unreal Editor', 'Blender', 'Perforce', 'Git']
      },
      'JavaScript': {
        frameworks: ['Phaser', 'Three.js', 'Babylon.js', 'PlayCanvas', 'Godot'],
        tools: ['VS Code', 'npm', 'Webpack', 'Git']
      },
      'TypeScript': {
        frameworks: ['Phaser', 'Three.js'],
        tools: ['VS Code', 'npm', 'Webpack', 'Git']
      },
      'Python': {
        frameworks: ['Pygame', 'Ursina', 'Godot'],
        tools: ['Blender (scripting)', 'VS Code', 'Git']
      },
      'GDScript': {
        frameworks: ['Godot'],
        tools: ['Godot Editor', 'Git']
      },
      'Lua': {
        frameworks: ['Love2D', 'Defold', 'Solar2D'],
        tools: ['ZeroBrane Studio', 'VS Code', 'Git']
      },
      'Java': {
        frameworks: ['libGDX'],
        tools: ['IntelliJ', 'VS Code', 'Git']
      },
      'Rust': {
        frameworks: ['Bevy', 'Fyrox', 'Macroquad'],
        tools: ['VS Code', 'cargo', 'Git']
      }
    },
    commonTools: [
      'Unity', 'Unreal Engine', 'Godot',
      'Blender', 'Maya', 'Photoshop',
      'VS Code', 'Visual Studio', 'IntelliJ', 'Rider',
      'Git', 'Perforce',
      'Steam SDK',
      'npm', 'Webpack',
      'HTML', 'CSS',
      'Tiled', 'Aseprite'
    ]
  },
  'Blockchain & Web3': {
    languages: {
      'Solidity': {
        frameworks: ['Hardhat', 'Truffle', 'Foundry'],
        tools: ['Remix IDE', 'Ganache', 'Metamask', 'Ethers.js', 'Web3.js', 'VS Code', 'Git']
      },
      'JavaScript': {
        frameworks: ['React', 'Vue.js', 'Next.js', 'Node.js', 'Express'],
        tools: ['Web3.js', 'Ethers.js', 'Metamask', 'VS Code', 'npm', 'Git']
      },
      'TypeScript': {
        frameworks: ['Next.js', 'React', 'Node.js', 'Express'],
        tools: ['Ethers.js', 'Hardhat', 'VS Code', 'npm', 'Git']
      },
      'Python': {
        frameworks: ['Brownie'],
        tools: ['Web3.py', 'VS Code', 'Git']
      },
      'Rust': {
        frameworks: ['Anchor', 'Near SDK'],
        tools: ['Solana CLI', 'cargo', 'VS Code', 'Git']
      },
      'Go': {
        frameworks: ['Hyperledger Fabric SDK Go', 'Go-Ethereum'],
        tools: ['Docker', 'VS Code', 'Git']
      },
      'C++': {
        frameworks: ['EOSIO', 'Bitcoin Core'],
        tools: ['Clang', 'Make', 'VS Code', 'Git']
      },
      'Java': {
        frameworks: ['Web3j', 'Spring'],
        tools: ['VS Code', 'IntelliJ', 'Git']
      }
    },
    commonTools: [
      'Metamask', 'Remix IDE', 'Ganache',
      'Web3.js', 'Ethers.js', 'Web3.py',
      'Git', 'VS Code', 'Docker', 'AWS',
      'PostgreSQL', 'MongoDB', 'The Graph',
      'npm', 'Foundry', 'Hardhat',
      'IPFS', 'Chainlink', 'Alchemy', 'Infura'
    ]
  },
  'Desktop Applications': {
    languages: {
      'C#': {
        frameworks: ['.NET', 'WPF', 'WinForms'],
        tools: ['Visual Studio', 'Resharper', 'Git']
      },
      'C++': {
        frameworks: ['Qt', 'wxWidgets', 'MFC'],
        tools: ['Qt Creator', 'Visual Studio', 'CMake', 'Git']
      },
      'Java': {
        frameworks: ['JavaFX', 'Swing', 'SWT'],
        tools: ['IntelliJ IDEA', 'Eclipse', 'Git']
      },
      'Python': {
        frameworks: ['PyQt', 'Tkinter', 'Kivy'],
        tools: ['VS Code', 'PyCharm', 'Git']
      },
      'JavaScript': {
        frameworks: ['Electron'],
        tools: ['VS Code', 'npm', 'Webpack', 'Git']
      },
      'TypeScript': {
        frameworks: ['Electron', 'Tauri'],
        tools: ['VS Code', 'npm', 'Vite', 'Git']
      },
      'Rust': {
        frameworks: ['Tauri', 'druid'],
        tools: ['cargo', 'VS Code', 'Git']
      },
      'Go': {
        frameworks: ['Fyne', 'Wails'],
        tools: ['VS Code', 'GoLand', 'Git']
      },
      'Swift': {
        frameworks: ['SwiftUI', 'AppKit', 'UIKit'],
        tools: ['Xcode', 'Git']
      }
    },
    commonTools: [
      'Visual Studio', 'VS Code', 'IntelliJ IDEA', 'Qt Creator', 'Xcode',
      'Git', 'Docker', 'npm', 'Webpack', 'Vite', 'Figma'
    ]
  },
  'Embedded Systems & IoT': {
    languages: {
      'C': {
        frameworks: ['Arduino', 'FreeRTOS', 'Zephyr', 'CMSIS', 'ChibiOS', 'STM32 HAL', 'LL'],
        tools: ['PlatformIO', 'Arduino IDE', 'Make', 'OpenOCD', 'STM32CubeIDE', 'GCC ARM Toolchain']
      },
      'C++': {
        frameworks: ['Arduino', 'ESP-IDF', 'mbed OS', 'Zephyr'],
        tools: ['PlatformIO', 'VS Code', 'Qt Creator', 'J-Link']
      },
      'Python': {
        frameworks: ['MicroPython', 'CircuitPython', 'Raspberry Pi GPIO'],
        tools: ['Thonny', 'VS Code', 'Jupyter']
      },
      'Rust': {
        frameworks: ['RTIC', 'embassy', 'Zephyr'],
        tools: ['cargo', 'probe-rs', 'VS Code']
      },
      'Assembly': {
        frameworks: [],
        tools: ['AVR Studio', 'Keil uVision', 'GDB']
      },
      'JavaScript': {
        frameworks: ['Johnny-Five', 'Node.js', 'Express'],
        tools: ['VS Code', 'npm', 'Git']
      },
      'Java': {
        frameworks: ['Android Things', 'Pi4J'],
        tools: ['Android Studio', 'VS Code', 'Eclipse IDE']
      },
      'Go': {
        frameworks: ['TinyGo'],
        tools: ['VS Code', 'Docker']
      }
    },
    commonTools: [
      'Arduino IDE', 'PlatformIO', 'VS Code', 'Git', 'Docker',
      'MQTT', 'InfluxDB', 'Grafana', 'AWS IoT', 'Firebase',
      'Balena', 'Node-RED', 'Zigbee2MQTT', 'Home Assistant', 'Wireshark'
    ]
  },
  'I am new to programming': {
    recommendedPaths: {
      frontend: {
        steps: ['HTML', 'CSS', 'JavaScript', 'React'],
        tools: ['VS Code', 'Chrome DevTools', 'GitHub'],
        explanation: 'Build websites that users can see and interact with.'
      },
      backend: {
        steps: ['Python', 'Flask', 'APIs', 'PostgreSQL'],
        tools: ['VS Code', 'Postman', 'Git'],
        explanation: 'Create the behind-the-scenes logic that powers websites and apps.'
      },
      fullstack: {
        steps: ['JavaScript', 'React', 'Express', 'PostgreSQL'],
        tools: ['GitHub', 'VS Code', 'Postman'],
        explanation: 'Build both the website design and the logic behind it.'
      },
      machineLearningAI: {
        steps: ['Python', 'NumPy', 'Pandas', 'Scikit-learn', 'Neural Networks'],
        tools: ['Jupyter Notebook', 'VS Code', 'Google Colab'],
        explanation: 'Teach computers to learn from data and make smart decisions.'
      },
      mobile: {
        steps: ['Dart', 'Flutter', 'Widgets', 'Firebase'],
        tools: ['Android Studio', 'Flutter DevTools', 'VS Code'],
        explanation: 'Make apps that work on both Android and iOS.'
      },
      gameDev: {
        steps: ['C#', 'Unity', '2D Games', 'Physics', 'Game Assets'],
        tools: ['Unity Editor', 'Visual Studio', 'Git'],
        explanation: 'Create your own games with graphics, controls, and sound.'
      }
    }
  }
};

// Custom Select Component with purple theme
const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}> = ({ value, onChange, placeholder, options, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        disabled={disabled}
        className="w-full px-4 py-3 pr-12 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm appearance-none cursor-pointer"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown 
          className={`w-5 h-5 text-purple-500 transition-all duration-300 ease-out ${
            isOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
          }`}
        />
      </div>
    </div>
  );
};

// Multi-Select Component with purple theme and tech stack filtering
const MultiSelect: React.FC<{
  selectedItems: string[];
  onChange: (items: string[]) => void;
  options: string[];
  placeholder: string;
  relevantItems?: string[];
  techStack?: string;
}> = ({ selectedItems, onChange, options, placeholder, relevantItems, techStack }) => {
  const toggleItem = (item: string) => {
    const newItems = selectedItems.includes(item)
      ? selectedItems.filter(i => i !== item)
      : [...selectedItems, item];
    onChange(newItems);
  };

  const isRelevant = (item: string) => {
    if (!relevantItems) return true;
    return relevantItems.includes(item);
  };

  const isDisabled = (item: string) => {
    return !!(techStack && !isRelevant(item));
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-theme-secondary">{placeholder}</div>
      {techStack && (
        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-3">
          ✨ Recommended for {techStack}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => {
          const disabled = isDisabled(option);
          const relevant = isRelevant(option);
          
          return (
            <label
              key={option}
              className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ${
                disabled
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50'
                  : 'border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
              title={disabled ? `Not typically used in ${techStack}` : undefined}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(option)}
                onChange={() => toggleItem(option)}
                disabled={disabled}
                className="rounded border-purple-300 text-purple-500 focus:ring-purple-500 accent-purple-500"
              />
              <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-theme-primary'}`}>
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

const OnboardingSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [options, setOptions] = useState<OnboardingOptions | null>(null);
  const [formData, setFormData] = useState<OnboardingUpdate>({});

  // Full-Stack specific state
  const [backendLanguage, setBackendLanguage] = useState<string>('');
  const [frontendLanguage, setFrontendLanguage] = useState<string>('');
  const [backendFramework, setBackendFramework] = useState<string>('');
  const [frontendFramework, setFrontendFramework] = useState<string>('');

  // Helper function to normalize tech stack names (remove parenthetical descriptions)
  const normalizeTechStackName = (stackName: string): string => {
    if (!stackName) return stackName;
    // Remove parenthetical descriptions like "(React, Vue, Angular)" 
    return stackName.replace(/\s*\([^)]*\)/g, '').trim();
  };

  // Helper function to check if Full-Stack is selected
  const isFullStack = (): boolean => {
    return normalizeTechStackName(formData.preferred_tech_stack || '') === 'Full-Stack Web Development';
  };

  // Helper functions for Full-Stack language categorization
  const getBackendLanguages = (): string[] => {
    if (!isFullStack()) return [];
    // Backend languages: Python, Java, C#, Go, PHP, Ruby
    return ['Python', 'Java', 'C#', 'Go', 'PHP', 'Ruby'];
  };

  const getFrontendLanguages = (): string[] => {
    if (!isFullStack()) return [];
    // Frontend languages: JavaScript, TypeScript
    return ['JavaScript', 'TypeScript'];
  };

  // Helper functions for Full-Stack framework categorization
  const getBackendFrameworks = (): string[] => {
    if (!isFullStack() || !backendLanguage) return [];
    const mapping = TECH_STACK_MAPPINGS['Full-Stack Web Development'];
    const langData = mapping.languages[backendLanguage as keyof typeof mapping.languages];
    if (!langData) return [];
    
    // Filter for backend frameworks
    const backendFrameworks = langData.frameworks.filter(framework => {
      const lowerFramework = framework.toLowerCase();
      return lowerFramework.includes('django') || lowerFramework.includes('flask') || 
             lowerFramework.includes('fastapi') || lowerFramework.includes('spring') ||
             lowerFramework.includes('asp.net') || lowerFramework.includes('gin') ||
             lowerFramework.includes('fiber') || lowerFramework.includes('echo') ||
             lowerFramework.includes('laravel') || lowerFramework.includes('symfony') ||
             lowerFramework.includes('rails') || lowerFramework.includes('sinatra') ||
             lowerFramework.includes('nestjs') || lowerFramework.includes('express') ||
             lowerFramework.includes('tornado') || lowerFramework.includes('micronaut') ||
             lowerFramework.includes('beego') || lowerFramework.includes('codeigniter');
    });
    
    return backendFrameworks;
  };

  const getFrontendFrameworks = (): string[] => {
    if (!isFullStack() || !frontendLanguage) return [];
    const mapping = TECH_STACK_MAPPINGS['Full-Stack Web Development'];
    const langData = mapping.languages[frontendLanguage as keyof typeof mapping.languages];
    if (!langData) return [];
    
    // Filter for frontend frameworks
    const frontendFrameworks = langData.frameworks.filter(framework => {
      const lowerFramework = framework.toLowerCase();
      return lowerFramework.includes('react') || lowerFramework.includes('next.js') ||
             lowerFramework.includes('angular') || lowerFramework.includes('vue');
    });
    
    return frontendFrameworks;
  };

  // Helper functions for filtering options based on tech stack
  const getRelevantLanguages = () => {
    if (!formData.preferred_tech_stack) return [];
    const normalizedStackName = normalizeTechStackName(formData.preferred_tech_stack);
    
    // Exclude Full-Stack from regular language selection
    if (normalizedStackName === 'Full-Stack Web Development') {
      return [];
    }
    
    const mapping = TECH_STACK_MAPPINGS[normalizedStackName as keyof typeof TECH_STACK_MAPPINGS] as any;
    if (!mapping) {
      return [];
    }
    
    // Handle different mapping structures
    if (mapping.languages && typeof mapping.languages === 'object' && !Array.isArray(mapping.languages)) {
      // Type 1: Has nested languages object (Frontend, Mobile, etc.)
      return Object.keys(mapping.languages);
    } else if (mapping.recommendedPaths) {
      // Type 3: "I am new to programming" - no direct language selection
      return [];
    } else {
      // Type 2: Direct language keys (Backend Development)
      return Object.keys(mapping).filter(key => key !== 'tools' && key !== 'commonTools');
    }
  };

  const getRelevantFrameworks = () => {
    if (!formData.preferred_tech_stack) return [];
    const normalizedStackName = normalizeTechStackName(formData.preferred_tech_stack);
    
    // Handle Full-Stack separately
    if (normalizedStackName === 'Full-Stack Web Development') {
      return [];
    }
    
    const mapping = TECH_STACK_MAPPINGS[normalizedStackName as keyof typeof TECH_STACK_MAPPINGS] as any;
    if (!mapping) return [];
    
    // If a specific language is selected, show only its frameworks
    if (formData.programming_languages && formData.programming_languages.length > 0) {
      const selectedLanguage = formData.programming_languages[0]; // Since we only allow one language
      
      if (mapping.languages && typeof mapping.languages === 'object' && !Array.isArray(mapping.languages)) {
        // Type 1: Has nested languages object (Frontend, Mobile, etc.)
        const langData = mapping.languages[selectedLanguage as keyof typeof mapping.languages];
        if (langData && langData.frameworks && Array.isArray(langData.frameworks)) {
          return langData.frameworks.filter((f: string) => f.trim().length > 0); // Filter out empty strings
        }
      } else if (mapping.recommendedPaths) {
        // Type 3: "I am new to programming" - no direct framework selection
        return [];
      } else {
        // Type 2: Direct language keys (Backend Development)
        const langData = mapping[selectedLanguage as keyof typeof mapping];
        if (langData && langData.frameworks && Array.isArray(langData.frameworks)) {
          return langData.frameworks.filter((f: string) => f.trim().length > 0); // Filter out empty strings
        }
      }
    }
    
    return [];
  };

  const getRelevantTools = (specificLanguage?: string) => {
    if (!formData.preferred_tech_stack) return [];
    const normalizedStackName = normalizeTechStackName(formData.preferred_tech_stack);
    const mapping = TECH_STACK_MAPPINGS[normalizedStackName as keyof typeof TECH_STACK_MAPPINGS] as any;
    if (!mapping) return [];
    
    const tools: string[] = [];
    
    // Use specific language if provided, otherwise use form data
    const languageToUse = specificLanguage || (formData.programming_languages && formData.programming_languages.length > 0 ? formData.programming_languages[0] : null);
    
    // If a specific language is selected, show only its tools + common tools
    if (languageToUse) {
      if (mapping.languages && typeof mapping.languages === 'object' && !Array.isArray(mapping.languages)) {
        // Type 1: Has nested languages object (Frontend, Mobile, etc.)
        const langData = mapping.languages[languageToUse as keyof typeof mapping.languages];
        if (langData && langData.tools && Array.isArray(langData.tools)) {
          tools.push(...langData.tools);
        }
        
        // Add common tools
        if (mapping.commonTools && Array.isArray(mapping.commonTools)) {
          tools.push(...mapping.commonTools);
        }
      } else if (mapping.recommendedPaths) {
        // Type 3: "I am new to programming" - no direct tool selection
        return [];
      } else {
        // Type 2: Direct language keys (Backend Development)
        const langData = mapping[languageToUse as keyof typeof mapping];
        if (langData && langData.tools && Array.isArray(langData.tools)) {
          tools.push(...langData.tools);
        }
        
        // Add common tools array
        if (mapping.tools && Array.isArray(mapping.tools)) {
          tools.push(...mapping.tools);
        }
      }
    }
    
    // Remove duplicates and filter out empty strings
  return [...new Set(tools)].filter((tool: string) => tool.trim().length > 0);
};

// Full-Stack event handlers
const handleBackendLanguageChange = (language: string) => {
  setBackendLanguage(language);
  setBackendFramework(''); // Clear framework when language changes
  updateFullStackLanguages(language, frontendLanguage);
};

const handleFrontendLanguageChange = (language: string) => {
  setFrontendLanguage(language);
  setFrontendFramework(''); // Clear framework when language changes
  updateFullStackLanguages(backendLanguage, language);
};

const handleBackendFrameworkChange = (framework: string) => {
  setBackendFramework(framework);
  updateFullStackFrameworks(framework, frontendFramework);
};

const handleFrontendFrameworkChange = (framework: string) => {
  setFrontendFramework(framework);
  updateFullStackFrameworks(backendFramework, framework);
};

const updateFullStackLanguages = (backend: string, frontend: string) => {
  const languages = [];
  if (backend) languages.push(backend);
  if (frontend && frontend !== backend) languages.push(frontend);
  updateFormData('programming_languages', languages);
  
  // Clear frameworks and tools when languages change
  updateFormData('frameworks', []);
  updateFormData('tools', []);
};

const updateFullStackFrameworks = (backend: string, frontend: string) => {
  const frameworks = [];
  if (backend) frameworks.push(backend);
  if (frontend && frontend !== backend) frameworks.push(frontend);
  updateFormData('frameworks', frameworks);
};

  // Load current onboarding data and options
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      const [currentData, optionsData] = await Promise.all([
        onboardingService.getOnboarding(),
        onboardingService.getOnboardingOptions()
      ]);
      
      setOnboardingData(currentData);
      setOptions(optionsData);

      // Ensure skill confidence value matches options list (case-insensitive and trimmed)
      const foundOption = optionsData.skill_confidence_options.find(opt => opt.trim().toLowerCase() === currentData.skill_confidence.trim().toLowerCase());
      const sanitizedSkillConfidence = foundOption || '';
      
      // Initialize form data with current values
      setFormData({
        current_year: currentData.current_year,
        major: currentData.major,
        programming_languages: currentData.programming_languages,
        frameworks: currentData.frameworks,
        tools: currentData.tools,
        preferred_tech_stack: currentData.preferred_tech_stack,
        experience_level: currentData.experience_level,
        skill_confidence: sanitizedSkillConfidence,
        has_internship_experience: currentData.has_internship_experience,
        previous_internships: currentData.previous_internships,
        projects: currentData.projects,
        target_roles: currentData.target_roles,
        preferred_company_types: currentData.preferred_company_types,
        preferred_locations: currentData.preferred_locations,
        application_timeline: currentData.application_timeline,
        additional_info: currentData.additional_info
      });

      // Handle Full-Stack specific data loading
      if (normalizeTechStackName(currentData.preferred_tech_stack) === 'Full-Stack Web Development') {
        const languages = currentData.programming_languages || [];
        const frameworks = currentData.frameworks || [];
        
        // Set backend/frontend languages (first two languages)
        if (languages.length > 0) setBackendLanguage(languages[0]);
        if (languages.length > 1) setFrontendLanguage(languages[1]);
        
        // Set backend/frontend frameworks (first two frameworks)
        if (frameworks.length > 0) setBackendFramework(frameworks[0]);
        if (frameworks.length > 1) setFrontendFramework(frameworks[1]);
      }
    } catch (err) {
      setError('Failed to load preferences data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Full-Stack validation
      if (isFullStack()) {
        if (!backendLanguage || !frontendLanguage) {
          setError('Please select both backend and frontend languages for Full-Stack development');
          setTimeout(() => setError(null), 3000);
          setSaving(false);
          return;
        }
        
        // Update formData with Full-Stack selections
        const fullStackLanguages = [backendLanguage, frontendLanguage];
        const fullStackFrameworks = [backendFramework, frontendFramework].filter(Boolean);
        
        updateFormData('programming_languages', fullStackLanguages);
        updateFormData('frameworks', fullStackFrameworks);
        
        // Update tools based on both languages
        const backendTools = getRelevantTools(backendLanguage);
        const frontendTools = getRelevantTools(frontendLanguage);
        const combinedTools = [...new Set([...backendTools, ...frontendTools])];
        
        // Keep existing selected tools that are still relevant
        const currentTools = formData.tools || [];
        const relevantCurrentTools = currentTools.filter(tool => combinedTools.includes(tool));
        updateFormData('tools', relevantCurrentTools);
      }
      
      // Filter out unchanged values
      const updateData: OnboardingUpdate = {};
      Object.keys(formData).forEach((key) => {
        const formKey = key as keyof OnboardingUpdate;
        if (JSON.stringify(formData[formKey]) !== JSON.stringify(onboardingData?.[formKey as keyof OnboardingData])) {
          (updateData as any)[formKey] = formData[formKey];
        }
      });

      if (Object.keys(updateData).length === 0) {
        setError('No changes to save');
        setTimeout(() => setError(null), 3000);
        return;
      }

      await onboardingService.updateOnboarding(updateData);
      
      // Invalidate any related caches to ensure fresh data is loaded for roadmap generation
      await queryClient.invalidateQueries({ queryKey: ['pipeline', 'status'] });
      await queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload data to ensure consistency
      await loadData(false);
      
      console.log('Settings saved successfully - Tech stack:', updateData.preferred_tech_stack || 'unchanged');
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof OnboardingUpdate, value: any) => {
    if (error) setError(null);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-theme-primary mb-2">Learning Preferences</h2>
        <p className="text-theme-secondary">Update your learning preferences and career goals. Changes here will affect your roadmap generation.</p>
      </div>

      <div className="space-y-8">
        {/* Academic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-primary border-b border-purple-200 dark:border-purple-700 pb-2">
            Academic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Current Academic Year
              </label>
              <CustomSelect
                value={formData.current_year || ''}
                onChange={(value) => updateFormData('current_year', value)}
                placeholder="Select your current academic year"
                options={(options?.current_year_options ? options.current_year_options.flatMap(option => option === 'Recent GraduateOther' ? ['Recent Graduate', 'Other'] : [option]) : []).map(opt => ({ value: opt, label: opt }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Field of Study
              </label>
              <input
                type="text"
                value={formData.major || ''}
                onChange={(e) => updateFormData('major', e.target.value)}
                className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your field of study"
              />
            </div>
          </div>
        </div>

        {/* Technical Background */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-primary border-b border-purple-200 dark:border-purple-700 pb-2">
            Technical Background
          </h3>
          
          {/* Tech Stack - Now First */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Preferred Tech Stack
            </label>
            <CustomSelect
              value={formData.preferred_tech_stack || ''}
              onChange={(value) => {
                // Clear all selections when changing tech stack
                updateFormData('preferred_tech_stack', value);
                updateFormData('programming_languages', []);
                updateFormData('frameworks', []);
                updateFormData('tools', []);
                
                // Clear Full-Stack specific selections
                setBackendLanguage('');
                setFrontendLanguage('');
                setBackendFramework('');
                setFrontendFramework('');
              }}
              placeholder="Select preferred tech stack"
              options={options?.preferred_tech_stack_options.map(option => ({ value: option, label: option })) || []}
            />
          </div>

          {/* Programming Languages - Conditional rendering based on Full-Stack */}
          {isFullStack() ? (
            <div className="space-y-4">
              {/* Backend Language Selection */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Backend Programming Language
                </label>
                <div className="space-y-3">
                  <div className="text-sm text-theme-secondary">Select your backend programming language</div>
                  <div className={`grid gap-3 ${
                    getBackendLanguages().length <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                    getBackendLanguages().length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {getBackendLanguages().map((language) => (
                      <label
                        key={`backend-${language}`}
                        className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                      >
                        <input
                          type="radio"
                          name="backend_language"
                          checked={backendLanguage === language}
                          onChange={() => handleBackendLanguageChange(language)}
                          className="rounded border-purple-300 text-purple-500 focus:ring-purple-500 accent-purple-500"
                        />
                        <span className="text-sm font-medium text-theme-primary">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Frontend Language Selection */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Frontend Programming Language
                </label>
                <div className="space-y-3">
                  <div className="text-sm text-theme-secondary">Select your frontend programming language</div>
                  <div className={`grid gap-3 ${
                    getFrontendLanguages().length <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                    getFrontendLanguages().length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {getFrontendLanguages().map((language) => (
                      <label
                        key={`frontend-${language}`}
                        className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                      >
                        <input
                          type="radio"
                          name="frontend_language"
                          checked={frontendLanguage === language}
                          onChange={() => handleFrontendLanguageChange(language)}
                          className="rounded border-purple-300 text-purple-500 focus:ring-purple-500 accent-purple-500"
                        />
                        <span className="text-sm font-medium text-theme-primary">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Primary Programming Language
              </label>
              <div className="space-y-3">
                <div className="text-sm text-theme-secondary">Select your main programming language</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getRelevantLanguages().map((language) => (
                    <label
                      key={language}
                      className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <input
                        type="radio"
                        name="primary_language"
                        checked={(formData.programming_languages || []).includes(language)}
                        onChange={() => {
                          updateFormData('programming_languages', [language]);
                          // Clear frameworks and tools when language changes
                          updateFormData('frameworks', []);
                          updateFormData('tools', []);
                        }}
                        className="rounded border-purple-300 text-purple-500 focus:ring-purple-500 accent-purple-500"
                      />
                      <span className="text-sm font-medium text-theme-primary">{language}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Frameworks - Conditional rendering based on Full-Stack */}
          {isFullStack() ? (
            <div className="space-y-4">
              {/* Backend Framework Selection */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Backend Framework
                </label>
                <div className="space-y-3">
                  <div className="text-sm text-theme-secondary">
                    {backendLanguage 
                      ? getBackendFrameworks().length > 0
                        ? `Select your backend framework for ${backendLanguage}`
                        : `${backendLanguage} is typically used without specific frameworks for backend development`
                      : "Select a backend language first to see available frameworks"
                    }
                  </div>
                  {backendLanguage && getBackendFrameworks().length > 0 && (
                    <div className={`grid gap-3 ${
                      getBackendFrameworks().length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                      getBackendFrameworks().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                      'grid-cols-1 md:grid-cols-2'
                    }`}>
                      {getBackendFrameworks().map((framework: string) => (
                        <label
                          key={`backend-${framework}`}
                          className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                        >
                          <input
                            type="radio"
                            name="backend_framework"
                            checked={backendFramework === framework}
                            onChange={() => handleBackendFrameworkChange(framework)}
                            className="rounded border-purple-300 text-purple-500 focus:ring-purple-500 accent-purple-500"
                          />
                          <span className="text-sm font-medium text-theme-primary">{framework}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {backendLanguage && getBackendFrameworks().length === 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">No Heavy Frameworks Needed</h4>
                          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                            {backendLanguage} for backend development focuses on core libraries and specialized tools rather than web frameworks.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Frontend Framework Selection */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Frontend Framework
                </label>
                <div className="space-y-3">
                  <div className="text-sm text-theme-secondary">
                    {frontendLanguage 
                      ? getFrontendFrameworks().length > 0
                        ? `Select your frontend framework for ${frontendLanguage}`
                        : `${frontendLanguage} is typically used without specific frameworks for frontend development`
                      : "Select a frontend language first to see available frameworks"
                    }
                  </div>
                  {frontendLanguage && getFrontendFrameworks().length > 0 && (
                    <div className={`grid gap-3 ${
                      getFrontendFrameworks().length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                      getFrontendFrameworks().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                      'grid-cols-1 md:grid-cols-2'
                    }`}>
                      {getFrontendFrameworks().map((framework: string) => (
                        <label
                          key={`frontend-${framework}`}
                          className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                        >
                          <input
                            type="radio"
                            name="frontend_framework"
                            checked={frontendFramework === framework}
                            onChange={() => handleFrontendFrameworkChange(framework)}
                            className="rounded border-purple-300 text-purple-500 focus:ring-purple-500 accent-purple-500"
                          />
                          <span className="text-sm font-medium text-theme-primary">{framework}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {frontendLanguage && getFrontendFrameworks().length === 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">No Heavy Frameworks Needed</h4>
                          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                            {frontendLanguage} for frontend development focuses on core libraries and specialized tools rather than web frameworks.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Primary Framework
              </label>
              <div className="space-y-3">
                <div className="text-sm text-theme-secondary">
                  {formData.programming_languages && formData.programming_languages.length > 0 
                    ? getRelevantFrameworks().length > 0
                      ? `Select your main framework for ${formData.programming_languages[0]}`
                      : `${formData.programming_languages[0]} is typically used without specific frameworks for this tech stack`
                    : "Select a programming language first to see available frameworks"
                  }
                </div>
                {formData.programming_languages && formData.programming_languages.length > 0 && getRelevantFrameworks().length > 0 && (
                  <div className={`grid gap-3 ${
                    getRelevantFrameworks().length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                    getRelevantFrameworks().length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                    'grid-cols-1 md:grid-cols-2'
                  }`}>
                    {getRelevantFrameworks().map((framework: string) => (
                      <label
                        key={framework}
                        className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                      >
                        <input
                          type="radio"
                          name="primary_framework"
                          checked={(formData.frameworks || []).includes(framework)}
                          onChange={() => updateFormData('frameworks', [framework])}
                          className="rounded border-purple-300 text-purple-500 focus:ring-purple-500 accent-purple-500"
                        />
                        <span className="text-sm font-medium text-theme-primary">{framework}</span>
                      </label>
                    ))}
                  </div>
                )}
                {formData.programming_languages && formData.programming_languages.length > 0 && getRelevantFrameworks().length === 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">No Heavy Frameworks Needed</h4>
                        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                          {formData.programming_languages[0]} for {normalizeTechStackName(formData.preferred_tech_stack || '')} focuses on core libraries and specialized tools rather than web frameworks.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tools - Multiple selection, filtered by language */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Tools & Technologies
            </label>
            <MultiSelect
              selectedItems={formData.tools || []}
              onChange={(items) => updateFormData('tools', items)}
              options={getRelevantTools()}
              placeholder={
                formData.programming_languages && formData.programming_languages.length > 0 
                  ? `Select tools relevant for ${formData.programming_languages[0]}`
                  : "Select a programming language first to see relevant tools"
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Experience Level
              </label>
              <CustomSelect
                value={formData.experience_level || ''}
                onChange={(value) => updateFormData('experience_level', value)}
                placeholder="Select experience level"
                options={options?.experience_level_options.map(option => ({ value: option, label: option })) || []}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Skill Confidence
              </label>
              <CustomSelect
                value={formData.skill_confidence || ''}
                onChange={(value) => updateFormData('skill_confidence', value)}
                placeholder="How confident are you in your skills?"
                options={options?.skill_confidence_options.map(option => ({ value: option, label: option })) || []}
              />
            </div>
          </div>
        </div>

        {/* Career Goals */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-theme-primary border-b border-purple-200 dark:border-purple-700 pb-2">
            Career Goals
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Target Roles
            </label>
            <MultiSelect
              selectedItems={formData.target_roles || []}
              onChange={(items) => updateFormData('target_roles', items)}
              options={options?.target_role_options || []}
              placeholder="Select target roles for internships"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Preferred Company Types
            </label>
            <MultiSelect
              selectedItems={formData.preferred_company_types || []}
              onChange={(items) => updateFormData('preferred_company_types', items)}
              options={options?.company_type_options || []}
              placeholder="Select preferred company types"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Application Timeline
            </label>
            <CustomSelect
              value={formData.application_timeline || ''}
              onChange={(value) => updateFormData('application_timeline', value)}
              placeholder="When are you planning to apply?"
              options={options?.timeline_options.map(option => ({ value: option, label: option })) || []}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-col items-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 text-white rounded-lg transition-colors duration-200"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="space-y-1">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Preferences updated successfully!</p>
                <p className="text-green-600 dark:text-green-400 text-xs">
                  💡 If you changed your tech stack or language, remember to regenerate your roadmap to get personalized content.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingSection;