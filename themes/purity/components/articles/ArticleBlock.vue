<template>
  <div class="article-block">
    <div class="article-block-title">
      <a :href="fullUrl" @click.prevent="toArticlePage">{{ displayTitle }}</a>
    </div>
    <div
      :class="{
        'article-block-abstract': true,
        'text-justify': $theme.articleList.useJustifyAlign,
      }"
      ref="abstract"
      v-html="renderedAbstract"
    ></div>
    <div class="article-block-footer">
      <div class="article-block-footer-time">
        <Date />
        <span>{{ date }}</span>
      </div>
      <div class="article-block-footer-controls">
        <a :href="fullUrl" class="button-read-all" @click.prevent="toArticlePage">
          {{ $t('read_more') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import Date from '../icons/Date';
import pangu from 'pangu.simple';
import { mapMutations } from 'vuex';
import { optimizeExternalLink } from '../../utils/renderer';

export default {
  name: 'fragy.purity.articles.block',
  props: {
    title: String,
    abstract: String,
    date: String,
    filename: String,
  },
  components: {
    Date,
  },
  data() {
    return {
      renderedAbstract: '',
    };
  },
  created() {
    this.setTitle(null);
  },
  mounted() {
    this.renderAbstract();
    this.$nextTick(() => {
      pangu.spacingNode(this.$refs.abstract);
      optimizeExternalLink(this.$refs.abstract);
    });
  },
  computed: {
    displayTitle() {
      return pangu.spacing(this.title);
    },
    fullUrl() {
      return `//${window.location.host}/article/${this.filename}`;
    },
  },
  methods: {
    ...mapMutations('article', ['setTitle']),
    renderAbstract() {
      this.renderedAbstract = window.marked(this.abstract);
    },
    toArticlePage() {
      this.setTitle(this.title);
      this.$router.push(`/article/${this.filename}`);
    },
  },
};
</script>

<style lang="less">
.article-block-text__prefix {
  margin-right: 8px;
  color: var(--article-block-text--prefix);
}

.article-block-text__prefix--small {
  margin-right: 6px;
}

.article-block {
  padding-top: 2.15rem;
  margin-bottom: 2.25rem;
  border-top: 0.0625rem dashed var(--article-block-border);
  &-title {
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: 0.05rem;
    margin-bottom: 1rem;
    a {
      display: block;
      width: max-content;
      position: relative;
      text-decoration: none;
      color: var(--article-block-text);
    }
    a:hover {
      cursor: pointer;
    }
    a:visited {
      color: var(--article-block-text);
    }
    a::after {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      width: 100%;
      height: 0.125rem;
      margin-top: 0.375rem;
      background: var(--article-block-text);
      transform: scale3d(0, 0, 1);
      transition: all 200ms ease-in-out;
    }
    a:hover::after {
      transform: scale3d(1, 1, 1);
    }
    p {
      color: var(--article-text);
    }
  }
  &-abstract {
    font-size: 1rem;
    line-height: 2rem;
    color: var(--article-block-text);
    a {
      color: var(--article-block-text);
    }
    a:hover {
      color: var(--article-block-hover) !important;
    }
    a:visited {
      color: var(--article-block-text);
    }
    h1,
    h2,
    h3,
    h4,
    h5 {
      margin: 0.75rem 0 0.5rem 0;
    }
    h1 {
      font-size: 1.25rem;
    }
    h1::before {
      content: '#';
      .article-block-text__prefix();
    }
    h2 {
      font-size: 1.175rem;
    }
    h2::before {
      content: '##';
      .article-block-text__prefix();
    }
    h3 {
      font-size: 1.15rem;
    }
    h3::before {
      content: '###';
      .article-block-text__prefix();
    }
    h4 {
      font-size: 1.125rem;
    }
    h4::before {
      content: '####';
      .article-block-text__prefix();
      .article-block-text__prefix--small();
    }
    h5 {
      font-size: 1.075rem;
    }
    h5::before {
      content: '#####';
      .article-block-text__prefix();
      .article-block-text__prefix--small();
    }
    p {
      margin: 0;
      line-height: 36px;
      code {
        padding: 4px 6px;
        background: var(--article-code-bg);
        font-size: 0.875rem;
      }
    }
    pre {
      background: var(--article-code-bg);
      font-size: 0.8125rem;
      padding: 0.75rem 1rem;
      box-sizing: border-box;
      overflow-x: auto;
      code {
        color: var(--article-code-text);
      }
    }
    img {
      display: block;
      max-width: 100%;
      margin: 1rem auto;
    }
  }
  &-footer {
    display: flex;
    align-items: center;
    margin-top: 1rem;
    &-time {
      display: flex;
      align-items: center;
      user-select: none;
      flex: 1 0 auto;
      svg {
        width: 1.125rem;
        height: 1.125rem;
        fill: var(--article-block-footer);
      }
      span {
        font-size: 0.875rem;
        margin-left: 0.5rem;
        letter-spacing: 0.025rem;
        color: var(--article-block-footer);
      }
    }
    &-controls {
      flex: 0 0 auto;
      justify-self: flex-end;
      user-select: none;
      a {
        color: var(--article-block-footer);
        font-size: 0.875rem;
        text-decoration: none;
        display: block;
        width: max-content;
        position: relative;
      }
      a:hover {
        color: var(--primary);
      }
      a::after {
        content: '';
        display: block;
        position: absolute;
        left: 0;
        width: 100%;
        height: 0.125rem;
        margin-top: 0.25rem;
        background: var(--primary);
        transform: scale3d(0, 0, 1);
        transition: all 200ms ease-in-out;
      }
      a:hover::after {
        transform: scale3d(1, 1, 1);
      }
    }
  }
}
.article-block:first-child {
  margin-top: 0;
}
.article-block:last-child {
  padding-bottom: 2.25rem;
  margin-bottom: 0;
  border-bottom: 0.0625rem dashed var(--article-block-border);
}

.dark {
  .article-block {
    &-abstract {
      img {
        filter: brightness(0.875);
      }
    }
  }
}
</style>
