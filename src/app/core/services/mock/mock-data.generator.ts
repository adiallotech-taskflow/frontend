import { Task, User, Workspace, WorkspaceMember } from '../../models';


class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  
  pick<T>(array: T[]): T {
    return array[this.int(0, array.length - 1)];
  }

  
  subset<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.next() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  
  weighted<T>(items: Array<{ item: T; weight: number }>): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.float(0, totalWeight);
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.item;
      }
    }
    
    return items[0].item; 
  }
}


export class MockDataLists {
  static readonly FIRST_NAMES = [
    'Alexandre', 'Antoine', 'Arthur', 'Baptiste', 'Benjamin', 'Clément', 'David', 'Émile',
    'Étienne', 'Fabien', 'Gabriel', 'Guillaume', 'Hugo', 'Julien', 'Lucas', 'Marc',
    'Maxime', 'Nicolas', 'Olivier', 'Paul', 'Pierre', 'Raphaël', 'Romain', 'Samuel',
    'Sébastien', 'Thomas', 'Adèle', 'Amélie', 'Anaïs', 'Camille', 'Charlotte', 'Chloé',
    'Claire', 'Emma', 'Inès', 'Jade', 'Julie', 'Léa', 'Lisa', 'Lucie', 'Manon',
    'Marie', 'Mathilde', 'Océane', 'Pauline', 'Sarah', 'Sofia', 'Valentine', 'Zoé'
  ];

  static readonly LAST_NAMES = [
    'Bernard', 'Blanchard', 'Bonnet', 'Bourgeois', 'Brun', 'Caron', 'Carpentier', 'Chevalier',
    'Colin', 'Deschamps', 'Dubois', 'Dumont', 'Dupont', 'Durand', 'Faure', 'Fontaine',
    'Fournier', 'Garcia', 'Garnier', 'Girard', 'Guerin', 'Henry', 'Hubert', 'Lambert',
    'Laurent', 'Leclerc', 'Lefevre', 'Legrand', 'Lemaire', 'Lemoine', 'Leroux', 'Leroy',
    'Martin', 'Mercier', 'Michel', 'Moreau', 'Morel', 'Muller', 'Nicolas', 'Perrin',
    'Petit', 'Picard', 'Richard', 'Robert', 'Robin', 'Roux', 'Roy', 'Simon', 'Thomas'
  ];

  static readonly TASK_TITLES = [
    'Implémenter l\'authentification JWT',
    'Optimiser les requêtes de base de données',
    'Créer les tests unitaires pour l\'API',
    'Refactoriser le système de cache',
    'Migrer vers Angular 20',
    'Configurer les pipelines CI/CD',
    'Développer l\'interface utilisateur',
    'Intégrer l\'API de paiement',
    'Corriger les vulnérabilités de sécurité',
    'Améliorer les performances frontend',
    'Documenter l\'architecture technique',
    'Mettre en place le monitoring',
    'Développer les notifications push',
    'Optimiser le build de production',
    'Créer le système de logs',
    'Implémenter le cache Redis',
    'Configurer Docker pour le déploiement',
    'Développer l\'API REST',
    'Mettre à jour les dépendances',
    'Créer les composants réutilisables',
    'Optimiser les images et assets',
    'Implémenter la recherche full-text',
    'Configurer les alertes de monitoring',
    'Développer le dashboard analytics',
    'Créer les migrations de données',
    'Implémenter le système de permissions',
    'Optimiser les requêtes GraphQL',
    'Configurer le load balancer',
    'Développer l\'import/export CSV',
    'Mettre en place l\'audit de sécurité'
  ];

  static readonly PROJECT_DESCRIPTIONS = [
    'Plateforme de gestion de projets avec collaboration en temps réel',
    'Application mobile pour la gestion des tâches personnelles',
    'Système de CRM pour la gestion de la relation client',
    'Dashboard analytics pour le suivi des KPIs business',
    'API de micro-services pour l\'architecture distribuée',
    'Interface d\'administration pour la gestion des utilisateurs',
    'Système de notification multi-canaux (email, SMS, push)',
    'Module de facturation automatisée avec intégrations bancaires',
    'Plateforme e-learning avec parcours personnalisés',
    'Système de gestion documentaire avec workflow',
    'Application de réservation en ligne avec calendrier',
    'Module de chat en temps réel avec support multimédia',
    'Système de surveillance de la performance applicative',
    'Plateforme de vote électronique sécurisée',
    'Interface de configuration de règles métier',
    'Système de backup automatisé avec chiffrement',
    'Module de rapports avec export multi-formats',
    'Plateforme de streaming vidéo avec CDN',
    'Système de gestion des stocks avec alertes',
    'Application de géolocalisation avec cartes interactives'
  ];

  static readonly WORKSPACE_NAMES = [
    'Projet Alpha', 'Innovation Lab', 'Digital Factory', 'Tech Hub', 'Product Team',
    'Engineering Core', 'Data Analytics', 'Mobile First', 'Cloud Native', 'DevOps Central',
    'UX Research', 'Backend Services', 'Frontend Squad', 'Security Team', 'Platform Core',
    'AI/ML Initiative', 'Integration Hub', 'Quality Assurance', 'Performance Team', 'Growth Hacking'
  ];

  static readonly COMPANY_DOMAINS = [
    'techcorp', 'innovate', 'digitech', 'nextsolutions', 'smartdev',
    'cloudtech', 'futurelab', 'agilesoft', 'dataflow', 'codelab',
    'techstartup', 'devstudio', 'softworks', 'techvision', 'digitalforge'
  ];

  static readonly ACTIVITY_ACTIONS = [
    'a créé la tâche',
    'a modifié la tâche',
    'a assigné la tâche à',
    'a changé le statut en',
    'a ajouté un commentaire sur',
    'a marqué comme prioritaire',
    'a défini l\'échéance pour',
    'a joint un fichier à',
    'a déplacé la tâche vers',
    'a archivé la tâche'
  ];

  static readonly TASK_PRIORITIES = [
    { item: 'low' as const, weight: 50 },
    { item: 'medium' as const, weight: 35 },
    { item: 'high' as const, weight: 15 }
  ];

  static readonly TASK_STATUSES = [
    { item: 'todo' as const, weight: 45 },
    { item: 'in-progress' as const, weight: 35 },
    { item: 'done' as const, weight: 20 }
  ];

  static readonly USER_ROLES = [
    { item: 'admin' as const, weight: 10 },
    { item: 'member' as const, weight: 70 },
    { item: 'viewer' as const, weight: 20 }
  ];
}


export class MockGeneratorUtils {
  private static rng = new SeededRandom();

  
  static getRng(): SeededRandom {
    return this.rng;
  }

  
  static setSeed(seed: number): void {
    this.rng = new SeededRandom(seed);
  }

  
  static randomDate(start: Date, end: Date): Date {
    const timestamp = this.rng.float(start.getTime(), end.getTime());
    return new Date(timestamp);
  }

  
  static randomEnum<T>(enumItems: Array<{ item: T; weight: number }>): T {
    return this.rng.weighted(enumItems);
  }

  
  static randomSubset<T>(array: T[], count: number): T[] {
    return this.rng.subset(array, count);
  }

  
  static weightedRandom<T>(items: Array<{ item: T; weight: number }>): T {
    return this.rng.weighted(items);
  }

  
  static generateEmail(firstName: string, lastName: string): string {
    const domain = this.rng.pick(MockDataLists.COMPANY_DOMAINS);
    const formats = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}.com`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}.com`,
      `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}.com`,
      `${firstName.toLowerCase()}@${domain}.com`
    ];
    return this.rng.pick(formats);
  }

  
  static generateAvatar(): string {
    const avatarId = this.rng.int(1, 70);
    return `https://i.pravatar.cc/150?img=${avatarId}`;
  }

  
  static generateTaskDescription(title: string): string {
    const descriptions = [
      `${title} - Cette tâche nécessite une analyse approfondie des besoins et une conception technique détaillée.`,
      `Objectif : ${title}. Prévoir une revue de code et des tests complets avant livraison.`,
      `${title} avec respect des bonnes pratiques de développement et documentation à jour.`,
      `Tâche critique : ${title}. Coordination requise avec l'équipe et validation client.`,
      `${title} - Implémentation progressive avec déploiement en environnement de test.`
    ];
    return this.rng.pick(descriptions);
  }

  
  static generateActivity(userName: string, taskTitle: string): string {
    const action = this.rng.pick(MockDataLists.ACTIVITY_ACTIONS);
    return `${userName} ${action} "${taskTitle}"`;
  }

  
  static generateDueDate(): Date {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + this.rng.int(1, 30));
    return futureDate;
  }

  
  static generateCreationDate(): Date {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - this.rng.int(1, 90));
    return pastDate;
  }

  
  static generateUpdateDate(createdAt: Date): Date {
    const now = new Date();
    return this.randomDate(createdAt, now);
  }

  
  static generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = this.rng.int(1000, 9999).toString(36);
    return `${prefix}${timestamp}-${random}`;
  }
}


export class MockDataGenerator {
  
  static generateUser(id?: string): User {
    const rng = MockGeneratorUtils.getRng();
    const firstName = rng.pick(MockDataLists.FIRST_NAMES);
    const lastName = rng.pick(MockDataLists.LAST_NAMES);
    const email = MockGeneratorUtils.generateEmail(firstName, lastName);
    const avatar = MockGeneratorUtils.generateAvatar();
    const role = MockGeneratorUtils.randomEnum(MockDataLists.USER_ROLES);
    const createdAt = MockGeneratorUtils.generateCreationDate();

    return {
      id: id || MockGeneratorUtils.generateId('user-'),
      firstName,
      lastName,
      email,
      avatar,
      role,
      createdAt,
      updatedAt: MockGeneratorUtils.generateUpdateDate(createdAt)
    };
  }

  
  static generateTask(options?: {
    id?: string;
    assigneeId?: string;
    workspaceId?: string;
    status?: Task['status'];
    priority?: Task['priority'];
  }): Task {
    const rng = MockGeneratorUtils.getRng();
    const title = rng.pick(MockDataLists.TASK_TITLES);
    const description = MockGeneratorUtils.generateTaskDescription(title);
    const status = options?.status || MockGeneratorUtils.randomEnum(MockDataLists.TASK_STATUSES);
    const priority = options?.priority || MockGeneratorUtils.randomEnum(MockDataLists.TASK_PRIORITIES);
    const createdAt = MockGeneratorUtils.generateCreationDate();
    const updatedAt = MockGeneratorUtils.generateUpdateDate(createdAt);
    
    
    const hasDueDate = rng.next() < 0.6;
    const dueDate = hasDueDate ? MockGeneratorUtils.generateDueDate() : undefined;

    return {
      id: options?.id || MockGeneratorUtils.generateId('task-'),
      title,
      description,
      status,
      priority,
      assigneeId: options?.assigneeId,
      workspaceId: options?.workspaceId || MockGeneratorUtils.generateId('ws-'),
      dueDate,
      createdAt,
      updatedAt
    };
  }

  
  static generateWorkspace(id?: string): Workspace {
    const rng = MockGeneratorUtils.getRng();
    const name = rng.pick(MockDataLists.WORKSPACE_NAMES);
    const description = rng.pick(MockDataLists.PROJECT_DESCRIPTIONS);
    const createdAt = MockGeneratorUtils.generateCreationDate();

    return {
      id: id || MockGeneratorUtils.generateId('ws-'),
      name,
      description,
      createdAt,
      updatedAt: MockGeneratorUtils.generateUpdateDate(createdAt),
      ownerId: MockGeneratorUtils.generateId('user-'),
      members: []
    };
  }

  
  static generateActivity(taskId: string, userId: string): {
    id: string;
    taskId: string;
    userId: string;
    action: string;
    timestamp: Date;
  } {
    const user = this.generateUser(userId);
    const task = this.generateTask({ id: taskId });
    const userName = `${user.firstName} ${user.lastName}`;
    const action = MockGeneratorUtils.generateActivity(userName, task.title);

    return {
      id: MockGeneratorUtils.generateId('activity-'),
      taskId,
      userId,
      action,
      timestamp: MockGeneratorUtils.generateCreationDate()
    };
  }

  
  static generateWorkspaceName(): string {
    const rng = MockGeneratorUtils.getRng();
    return rng.pick(MockDataLists.WORKSPACE_NAMES);
  }

  
  static generateCohesiveDataset(options: {
    userCount?: number;
    workspaceCount?: number;
    taskCount?: number;
    seed?: number;
  } = {}): {
    users: User[];
    workspaces: Workspace[];
    tasks: Task[];
  } {
    const {
      userCount = 10,
      workspaceCount = 3,
      taskCount = 25,
      seed = 12345
    } = options;

    
    MockGeneratorUtils.setSeed(seed);

    
    const users = Array.from({ length: userCount }, (_, i) => 
      this.generateUser(`user-${i + 1}`)
    );

    
    const workspaces = Array.from({ length: workspaceCount }, (_, i) => {
      const rng = MockGeneratorUtils.getRng();
      const workspace = this.generateWorkspace(`ws-${i + 1}`);
      
      workspace.ownerId = rng.pick(users).id;
      const memberUserIds = MockGeneratorUtils.randomSubset(
        users.map(u => u.id), 
        rng.int(2, Math.min(6, userCount))
      );
      
      
      workspace.members = memberUserIds.map(userId => ({
        userId,
        role: MockGeneratorUtils.randomEnum([
          { item: 'admin' as const, weight: 10 },
          { item: 'member' as const, weight: 80 },
          { item: 'viewer' as const, weight: 10 }
        ]),
        joinedAt: MockGeneratorUtils.randomDate(workspace.createdAt, new Date())
      }));
      
      return workspace;
    });

    
    const tasks = Array.from({ length: taskCount }, (_, i) => {
      const rng = MockGeneratorUtils.getRng();
      const workspaceId = rng.pick(workspaces).id;
      const workspace = workspaces.find(w => w.id === workspaceId)!;
      const assigneeId = rng.next() < 0.8 ? 
        rng.pick(workspace.members).userId : 
        undefined;

      return this.generateTask({
        id: `task-${i + 1}`,
        workspaceId,
        assigneeId
      });
    });

    return { users, workspaces, tasks };
  }
}


export const mockDataGenerator = MockDataGenerator;